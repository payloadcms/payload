/* eslint-disable payload/no-relative-monorepo-imports -- Verify native autosave ownership with localization disabled. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { updateOperation } from '../../packages/payload/src/globals/operations/update.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import {
  commitBranchHeads,
  readBranchHead,
  readBranchHeads,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { saveBranchAutosave } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { fractionalIDsSlug, scalarArticlesSlug, settingsSlug } from './slugs.js'

test.suite(
  'Autosave ownership without localization',
  { config: './autosave-scalar.config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test('should attach a status-only first inherited autosave and coalesce identical shared content', async ({
      payload,
    }) => {
      await activate({ payload, collection: scalarArticlesSlug })
      const article = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'unchanged', _status: 'published' },
        depth: 0,
      })
      let firstID: number | string | undefined
      let count: number | undefined

      for (const generation of [1, 2, 3]) {
        await payload.update({
          collection: scalarArticlesSlug,
          id: article.id,
          data: { title: 'unchanged' },
          draft: true,
          autosave: true,
          depth: 0,
        })
        const versions = await payload.findVersions({
          collection: scalarArticlesSlug,
          where: { parent: { equals: article.id } },
          sort: '-updatedAt',
        })
        const native = await payload.db.findVersions({
          collection: scalarArticlesSlug,
          where: { id: { equals: versions.docs[0]!.id } },
        })
        const req = await createPayloadRequest({ payload })
        const head = await readBranchHead({
          branchID: 'drafts',
          req,
          scope: { type: 'shared' },
          target: {
            collection: payload.collections[scalarArticlesSlug]!.config.custom.branchStorage.heads,
            parentID: article.id,
          },
        })

        firstID ??= native.docs[0]!.id
        count ??= versions.totalDocs
        expect(versions.totalDocs).toBe(count)
        expect(native.docs[0]).toMatchObject({
          id: firstID,
          autosave: true,
          branchFrozen: false,
          branchGeneration: generation,
          latest: true,
        })
        expect(head?.state).toEqual({
          type: 'version',
          version: { id: firstID, generation },
          structure: null,
        })
      }
      expect(
        await payload.findByID({ collection: scalarArticlesSlug, id: article.id, depth: 0 }),
      ).toMatchObject({ title: 'unchanged', _status: 'published' })
    })

    test('should preserve the released global operation autosave identity and history count', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'released live', _status: 'published' },
        depth: 0,
      })
      const globalConfig = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      let firstID: number | string | undefined
      let count: number | undefined

      for (const title of ['released one', 'released two', 'released three']) {
        const req = await createPayloadRequest({ payload })

        await updateOperation({
          slug: settingsSlug,
          globalConfig,
          data: { title },
          draft: true,
          autosave: true,
          overrideAccess: true,
          req,
          depth: 0,
        })
        const versions = await payload.findGlobalVersions({
          slug: settingsSlug,
          sort: '-updatedAt',
        })

        firstID ??= versions.docs[0]!.id
        count ??= versions.totalDocs
        expect(versions.docs[0]!.id).toBe(firstID)
        expect(versions.totalDocs).toBe(count)
        expect(versions.docs[0]!.version.title).toBe(title)
      }
      expect(await payload.db.findGlobal({ slug: settingsSlug })).toMatchObject({
        title: 'released live',
        _status: 'published',
      })
    })

    test('should coalesce an identical global autosave without updating the materialized global', async ({
      payload,
    }) => {
      await activate({ payload, global: settingsSlug })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'unchanged global', _status: 'published' },
        depth: 0,
      })
      let firstID: number | string | undefined
      let count: number | undefined

      for (const generation of [1, 2, 3]) {
        await payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'unchanged global' },
          draft: true,
          autosave: true,
          depth: 0,
        })
        const versions = await payload.findGlobalVersions({
          slug: settingsSlug,
          sort: '-updatedAt',
        })
        const native = await payload.db.findGlobalVersions({
          global: settingsSlug,
          where: { id: { equals: versions.docs[0]!.id } },
        })

        firstID ??= native.docs[0]!.id
        count ??= versions.totalDocs
        expect(versions.totalDocs).toBe(count)
        expect(native.docs[0]).toMatchObject({
          id: firstID,
          branchFrozen: false,
          branchGeneration: generation,
          latest: true,
        })
      }
      expect(await payload.db.findGlobal({ slug: settingsSlug })).toMatchObject({
        title: 'unchanged global',
        _status: 'published',
      })
    })

    test('should coalesce the first global draft without creating an ordinary singleton', async ({
      payload,
    }) => {
      await activate({ payload, global: settingsSlug })
      let firstID: number | string | undefined

      for (const [index, title] of ['first draft', 'second draft'].entries()) {
        await payload.updateGlobal({
          slug: settingsSlug,
          data: { title },
          autosave: true,
          draft: true,
          depth: 0,
        })
        const versions = await payload.db.findGlobalVersions({
          global: settingsSlug,
          sort: '-updatedAt',
        })

        firstID ??= versions.docs[0]!.id
        expect(versions.docs[0]).toMatchObject({
          id: firstID,
          branchGeneration: index + 1,
          branchFrozen: false,
          version: { title },
        })
        expect((await payload.db.findGlobal({ slug: settingsSlug }))?.id).toBeUndefined()
      }
    })

    test('should reject standalone replacement of an attached mutable version without dangling its head', async ({
      payload,
    }) => {
      await activate({ payload, collection: scalarArticlesSlug })
      const article = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'live', _status: 'published' },
        depth: 0,
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: article.id,
        data: { title: 'attached' },
        autosave: true,
        draft: true,
        depth: 0,
      })
      const versions = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { parent: { equals: article.id }, autosave: { equals: true } },
      })
      const row = versions.docs[0]!
      const target = {
        collection: payload.collections[scalarArticlesSlug]!.config.custom.branchStorage.heads,
        parentID: article.id,
      }

      await expect(
        inTransaction({
          payload,
          run: async ({ req }) => {
            await saveBranchAutosave({
              branchID: 'drafts',
              data: { title: 'invalid replacement' },
              expected: { id: row.id, generation: row.branchGeneration as number },
              req,
              target,
            })
          },
        }),
      ).rejects.toThrow('complete guarded head ownership')
      const after = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { id: { equals: row.id } },
      })

      expect(after.docs[0]).toEqual(row)
      expect(
        await payload.findByID({
          collection: scalarArticlesSlug,
          id: article.id,
          draft: true,
          depth: 0,
        }),
      ).toMatchObject({ title: 'attached' })
    })

    test('should coalesce the real numeric-zero document without touching its neighbor', async ({
      payload,
    }) => {
      await activate({ payload, collection: fractionalIDsSlug })
      await payload.create({
        collection: fractionalIDsSlug,
        data: { id: 1, title: 'neighbor', _status: 'published' },
        depth: 0,
      })
      const zero = await payload.create({
        collection: fractionalIDsSlug,
        data: { id: 0, title: 'zero live', _status: 'published' },
        depth: 0,
      })
      let firstID: number | string | undefined

      expect(zero.id).toBe(0)
      for (const [index, title] of ['zero one', 'zero two'].entries()) {
        await payload.update({
          collection: fractionalIDsSlug,
          id: 0,
          data: { title },
          draft: true,
          autosave: true,
          depth: 0,
        })
        const native = await payload.db.findVersions({
          collection: fractionalIDsSlug,
          where: { parent: { equals: 0 }, autosave: { equals: true } },
        })

        firstID ??= native.docs[0]!.id
        expect(native.docs).toHaveLength(1)
        expect(native.docs[0]).toMatchObject({
          id: firstID,
          parent: 0,
          branchGeneration: index + 1,
          version: { title },
        })
      }
      expect(
        await payload.findByID({ collection: fractionalIDsSlug, id: 1, draft: true, depth: 0 }),
      ).toMatchObject({ title: 'neighbor' })
      expect(
        await payload.findByID({ collection: fractionalIDsSlug, id: 0, depth: 0 }),
      ).toMatchObject({ title: 'zero live' })
    })

    test('should freeze discarded autosave history without retaining a permanent pin', async ({
      payload,
    }) => {
      await activate({ payload, collection: scalarArticlesSlug })
      const article = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'live', _status: 'published' },
        depth: 0,
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: article.id,
        data: { title: 'discarded working' },
        autosave: true,
        draft: true,
        depth: 0,
      })
      const autosaves = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { parent: { equals: article.id }, autosave: { equals: true } },
      })
      const retired = autosaves.docs[0]!
      const config = payload.collections[scalarArticlesSlug]!.config
      const target = { collection: config.custom.branchStorage.heads, parentID: article.id }

      await inTransaction({
        payload,
        run: async ({ req }) => {
          const readSet = await readBranchHeads({
            req,
            target,
            selections: ['main', 'drafts'].map((branchID) => ({
              branchID,
              scope: { type: 'shared' as const },
            })),
          })

          await commitBranchHeads({
            changes: [{ expected: readSet[1]!, nextState: null }],
            readSet,
            req,
            target,
          })
        },
      })
      const frozen = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { id: { equals: retired.id } },
      })
      const pins = await payload.db.find({
        collection: config.custom.branchStorage.pins,
        where: { versionID: { equals: retired.id } },
      })

      expect(frozen.docs[0]).toMatchObject({
        branchFrozen: true,
        branchGeneration: retired.branchGeneration,
        version: retired.version,
      })
      expect(pins.docs).toHaveLength(0)
      for (const index of [1, 2, 3, 4, 5]) {
        await payload.db.createVersion({
          collectionSlug: scalarArticlesSlug,
          parent: article.id,
          autosave: false,
          branchMode: true,
          createdAt: `2099-01-0${index}T00:00:00.000Z`,
          updatedAt: `2099-01-0${index}T00:00:00.000Z`,
          versionData: { title: `unprotected ${index}` },
        })
      }
      await payload.update({
        collection: scalarArticlesSlug,
        id: article.id,
        data: { title: 'new owner' },
        autosave: true,
        draft: true,
        depth: 0,
      })
      expect(
        (
          await payload.db.findVersions({
            collection: scalarArticlesSlug,
            where: { id: { equals: retired.id } },
          })
        ).docs,
      ).toHaveLength(0)
      expect(
        await payload.findByID({
          collection: scalarArticlesSlug,
          id: article.id,
          draft: true,
          depth: 0,
        }),
      ).toMatchObject({ title: 'new owner' })
    })

    test('should retain an older current mutable head while pruning newer unprotected history', async ({
      payload,
    }) => {
      await activate({ payload, collection: scalarArticlesSlug })
      const article = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'live', _status: 'published' },
        depth: 0,
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: article.id,
        data: { title: 'working' },
        autosave: true,
        draft: true,
        depth: 0,
      })
      const autosaves = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { parent: { equals: article.id }, autosave: { equals: true } },
      })
      const currentID = autosaves.docs[0]!.id
      const unprotectedIDs: (number | string)[] = []

      for (const index of [1, 2, 3, 4, 5]) {
        const created = await payload.db.createVersion({
          collectionSlug: scalarArticlesSlug,
          parent: article.id,
          autosave: false,
          branchMode: true,
          createdAt: `2099-01-0${index}T00:00:00.000Z`,
          updatedAt: `2099-01-0${index}T00:00:00.000Z`,
          versionData: { title: `unprotected ${index}` },
        })

        unprotectedIDs.push(created.id)
      }
      await payload.update({
        collection: scalarArticlesSlug,
        id: article.id,
        data: { title: 'still working' },
        autosave: true,
        draft: true,
        depth: 0,
      })
      const retained = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { id: { equals: currentID } },
      })
      const unprotected = await payload.db.findVersions({
        collection: scalarArticlesSlug,
        where: { id: { in: unprotectedIDs } },
      })

      expect(retained.docs[0]).toMatchObject({
        branchFrozen: false,
        branchGeneration: 2,
        version: { title: 'still working' },
      })
      expect(unprotected.docs).toHaveLength(3)
    })
  },
)

const activate = async ({
  payload,
  collection,
  global,
}: {
  collection?: string
  global?: string
  payload: Payload
}): Promise<void> => {
  const config = collection
    ? payload.collections[collection]!.config
    : payload.globals.config.find(({ slug }) => slug === global)!

  await payload.db.create({
    collection: config.custom.branchStorage.cutover,
    data: {
      singleton: 'authoritative',
      schemaGeneration: 1,
      migrationID: 'autosave-empty-source',
      generation: 1,
      isActivated: true,
    },
  })
  await inTransaction({
    payload,
    run: async ({ req }) => {
      for (const branchID of ['main', 'drafts']) {
        await bootstrapBranchProjectionPage({
          branchID,
          collection: config.custom.branchStorage.heads,
          req,
        })
      }
    },
  })
}

const inTransaction = async ({
  payload,
  run,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<void>
}): Promise<void> => {
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID == null) {
    throw new Error('A native transaction is required.')
  }
  req.transactionID = transactionID
  try {
    await run({ req })
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
