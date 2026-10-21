/* eslint-disable payload/no-relative-monorepo-imports -- Verify unsupported branch adapters fail before mutating legacy data. */
import type { CollectionSlug, Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import {
  commitBranchHeads,
  discardBranchHead,
  readBranchHead,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import {
  allocateBranchIdentity,
  createBranchIdentityVisibility,
  updateBranchIdentityVisibility,
} from '../../packages/payload/src/versions/branches/storage/branchIdentityStore.js'
import {
  initializeBranchVersion,
  pinBranchVersion,
  saveBranchAutosave,
} from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { unsupportedBranchDatabaseOptions } from './adapterCapabilities.js'
import { articleHeadsSlug, articlesSlug, settingsHeadsSlug, settingsSlug } from './slugs.js'

const scope = { locale: 'en', type: 'locale' as const }

test.suite(
  'Unsupported branch adapter contracts',
  { config: './config.ts', ...unsupportedBranchDatabaseOptions },
  () => {
    test('should report both atomic capabilities unavailable without creating a caller session', async ({
      payload,
    }) => {
      const req = await createPayloadRequest({ payload })
      const sessions = Object.keys(payload.db.sessions ?? {})

      expect(await payload.db.branching!.capabilities({})).toMatchObject({
        atomicBatch: false,
        interactiveTransactions: false,
        reason: 'MongoDB transactions are disabled.',
      })
      expect(await payload.db.branching!.capabilities({ req })).toMatchObject({
        atomicBatch: false,
        interactiveTransactions: false,
      })
      expect(await payload.db.beginTransaction()).toBeNull()
      expect(req.transactionID).toBeUndefined()
      expect(Object.keys(payload.db.sessions ?? {})).toStrictEqual(sessions)
    })

    for (const entityType of ['collection', 'global'] as const) {
      test(`should refuse every ${entityType} branch mutation without changing content or durable roots`, async ({
        payload,
      }) => {
        const article = await payload.create({
          collection: articlesSlug,
          data: { title: 'Existing draft' },
          draft: true,
        })

        await payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'Existing global draft' },
          draft: true,
        })

        const req = await createPayloadRequest({ payload })
        const target =
          entityType === 'collection'
            ? { collection: articleHeadsSlug, parentID: article.id }
            : { collection: settingsHeadsSlug }
        const entity =
          entityType === 'collection'
            ? { type: entityType, slug: articlesSlug, parentID: article.id }
            : { type: entityType, slug: settingsSlug }
        const versions =
          entityType === 'collection'
            ? await payload.db.findVersions({ collection: articlesSlug })
            : await payload.db.findGlobalVersions({ global: settingsSlug })
        const versionID = versions.docs[0]!.id
        const reference = { id: versionID, generation: 1 }
        const expected = { branchID: 'staging', generation: null, scope, state: null }
        const before = await snapshotStorage({ payload })
        const mutations = [
          () =>
            initializeBranchVersion({
              branchID: 'staging',
              isFrozen: false,
              req,
              target,
              versionID,
            }),
          () => pinBranchVersion({ reference, req, rootKey: 'schedule', target }),
          () =>
            saveBranchAutosave({
              branchID: 'staging',
              data: { title: { en: 'Rejected replacement' } },
              expected: reference,
              req,
              target,
            }),
          () => writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
          () => discardBranchHead({ expected, req, target }),
          () => commitBranchHeads({ readSet: [expected], changes: [], req, target }),
          () =>
            createBranchIdentityVisibility({
              branchID: 'staging',
              isLegacyDraftVisible: false,
              req,
              target,
            }),
          () =>
            updateBranchIdentityVisibility({
              expectedGeneration: 1,
              isPublished: true,
              req,
              target,
            }),
          () =>
            allocateBranchIdentity({
              branchID: 'staging',
              collection: articlesSlug,
              data: { title: { en: 'Rejected anchor' } },
              isLegacyDraftVisible: false,
              req,
            }),
          ...(['initialize', 'freeze', 'replace'] as const).map(
            (type) => () =>
              payload.db.branching!.mutateVersion({
                entity,
                expected: { id: versionID, generation: type === 'initialize' ? 0 : 1 },
                mutation:
                  type === 'initialize'
                    ? { type, isFrozen: false, ownerKey: 'string:staging' }
                    : type === 'replace'
                      ? {
                          type,
                          data: { title: { en: 'Rejected native replacement' } },
                          ownerKey: 'string:staging',
                        }
                      : { type },
                req,
              }),
          ),
        ]

        for (const transactionID of [undefined, 'unowned-transaction']) {
          req.transactionID = transactionID

          for (const mutate of mutations) {
            await expect(mutate()).rejects.toThrow(/transactions are disabled/)
          }
        }

        req.transactionID = undefined

        expect(await snapshotStorage({ payload })).toStrictEqual(before)
        expect(await readBranchHead({ branchID: 'staging', req, scope, target })).toBeNull()
        expect(Object.keys(payload.db.sessions ?? {})).toHaveLength(0)
      })
    }

    test('should preserve legacy collection and global draft writes, published reads and version history', async ({
      payload,
    }) => {
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'Live article' },
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'Working article' },
        draft: true,
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { _status: 'published', title: 'Live global' },
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Working global' },
        draft: true,
      })

      expect((await payload.findByID({ collection: articlesSlug, id: article.id })).title).toBe(
        'Live article',
      )
      expect(
        (await payload.findByID({ collection: articlesSlug, id: article.id, draft: true })).title,
      ).toBe('Working article')
      expect((await payload.findGlobal({ slug: settingsSlug })).title).toBe('Live global')
      expect((await payload.findGlobal({ slug: settingsSlug, draft: true })).title).toBe(
        'Working global',
      )

      const articleHistory = await payload.findVersions({ collection: articlesSlug })
      const globalHistory = await payload.findGlobalVersions({ slug: settingsSlug })

      expect(articleHistory.docs.map(({ version }) => version.title)).toEqual(
        expect.arrayContaining(['Live article', 'Working article']),
      )
      expect(globalHistory.docs.map(({ version }) => version.title)).toEqual(
        expect.arrayContaining(['Live global', 'Working global']),
      )
    })
  },
)

const snapshotStorage = async ({ payload }: { payload: Payload }) => {
  const collections: CollectionSlug[] = [articlesSlug, articleHeadsSlug, settingsHeadsSlug]

  for (const config of [
    payload.collections[articlesSlug]!.config,
    payload.globals.config.find(({ slug }) => slug === settingsSlug)!,
  ]) {
    collections.push(config.custom!.branchStorage.pins, config.custom!.branchStorage.identities)
  }

  return {
    collections: await Promise.all(
      collections.map((collection) =>
        payload.db.find({ collection, locale: 'all', pagination: false, sort: 'id' }),
      ),
    ),
    global: await payload.db.findGlobal({ slug: settingsSlug, locale: 'all' }),
    collectionVersions: await payload.db.findVersions({
      collection: articlesSlug,
      locale: 'all',
      pagination: false,
      sort: 'id',
    }),
    globalVersions: await payload.db.findGlobalVersions({
      global: settingsSlug,
      locale: 'all',
      pagination: false,
      sort: 'id',
    }),
  }
}
