/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the internal store against native adapters before exposing runtime APIs. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import type { BranchHeadState } from '../../packages/payload/src/versions/branches/types.js'

import {
  discardBranchHead,
  readBranchHead,
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { initializeBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { articleHeadsSlug, articlesSlug, settingsHeadsSlug, settingsSlug } from './slugs.js'

const scope = { locale: 'en', type: 'locale' as const }

test.suite('Native branch head storage', { config: './config.ts' }, () => {
  const requests: PayloadRequest[] = []
  const transactionRequest = async ({ payload }: { payload: Payload }): Promise<PayloadRequest> => {
    const req = await createPayloadRequest({ payload })

    req.transactionID = (await payload.db.beginTransaction())!
    requests.push(req)

    return req
  }

  test.afterEach(async () => {
    for (const req of requests.splice(0)) {
      if (req.transactionID !== undefined) {
        await req.payload.db.rollbackTransaction(req.transactionID)
      }
    }
  })
  test.options(
    'should persist a head with the logical parent and typed version identity',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'working' },
        draft: true,
      })
      const versions = await payload.findVersions({
        collection: articlesSlug,
        where: { parent: { equals: article.id } },
      })
      const versionID = versions.docs[0]!.id
      const req = await transactionRequest({ payload })
      const target = { collection: articleHeadsSlug, parentID: article.id }
      await initializeBranchVersion({ branchID: 'drafts', isFrozen: false, req, target, versionID })

      const written = await writeBranchHead({
        expected: { branchID: 'drafts', generation: null, scope, state: null },
        nextState: { structure: null, type: 'version', version: { generation: 1, id: versionID } },
        req,
        target,
      })
      const read = await readBranchHead({ branchID: 'drafts', req, scope, target })

      expect(read).toStrictEqual(written)
      expect(read?.generation).toBe(1)
      expect(read?.state).toStrictEqual({
        structure: null,
        type: 'version',
        version: { generation: 1, id: versionID },
      })
    },
  )

  test.options(
    'should reject an obsolete generation after a successful advance',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const req = await transactionRequest({ payload })
      const target = { collection: settingsHeadsSlug }
      const initial = await writeBranchHead({
        expected: { branchID: 'staging', generation: null, scope, state: null },
        nextState: { type: 'withdrawn' },
        req,
        target,
      })

      expect(initial).not.toBeNull()

      const expected = {
        branchID: 'staging',
        generation: initial!.generation,
        scope,
        state: initial!.state,
      }
      const results = [
        await writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
        await writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
      ]

      expect(results.filter(Boolean)).toHaveLength(1)
      expect(results.filter((result) => result === null)).toHaveLength(1)
      expect((await readBranchHead({ branchID: 'staging', req, scope, target }))?.generation).toBe(
        2,
      )
    },
  )

  test.options(
    'should permit only one first head across competing caller transactions',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const target = { collection: settingsHeadsSlug }
      const results = await Promise.allSettled(
        [0, 1].map(async () => {
          const req = await transactionRequest({ payload })

          try {
            const result = await writeBranchHead({
              expected: { branchID: 'drafts', generation: null, scope, state: null },
              nextState: { type: 'withdrawn' },
              req,
              target,
            })

            await payload.db.commitTransaction(req.transactionID!)
            req.transactionID = undefined

            return result
          } catch (error) {
            await payload.db.rollbackTransaction(req.transactionID!)
            req.transactionID = undefined
            throw error
          }
        }),
      )

      expect(
        results.filter((result) => result.status === 'fulfilled' && result.value !== null),
      ).toHaveLength(1)
      expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(1)
    },
  )

  test.options(
    'should preserve the captured base and clear all content references on withdrawal',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const req = await transactionRequest({ payload })
      const target = { collection: settingsHeadsSlug }
      const base = { branchID: 'main', generation: null, scope, state: null } as const
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Working' },
        draft: true,
        req,
      })

      const versions = await payload.db.findGlobalVersions({ global: settingsSlug, req, limit: 1 })
      const versionID = versions.docs[0]!.id

      await initializeBranchVersion({ branchID: 'drafts', isFrozen: false, req, target, versionID })
      const initial = await writeBranchHead({
        base,
        expected: { branchID: 'drafts', generation: null, scope, state: null },
        nextState: {
          structure: { generation: 1, id: versionID },
          type: 'version',
          version: { generation: 1, id: versionID },
        },
        req,
        target,
      })
      const withdrawn = await writeBranchHead({
        expected: {
          branchID: 'drafts',
          generation: initial!.generation,
          scope,
          state: initial!.state,
        },
        nextState: { type: 'withdrawn' },
        req,
        target,
      })

      expect(withdrawn?.base).toStrictEqual(base)
      expect(withdrawn?.state).toStrictEqual({ type: 'withdrawn' })
      expect(withdrawn?.generation).toBe(2)
    },
  )

  test.options(
    'should keep numeric and string branch identities separate',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const req = await transactionRequest({ payload })
      const target = { collection: settingsHeadsSlug }

      await writeBranchHead({
        expected: { branchID: 1, generation: null, scope, state: null },
        nextState: { type: 'withdrawn' },
        req,
        target,
      })
      await writeBranchHead({
        expected: { branchID: '1', generation: null, scope, state: null },
        nextState: { type: 'withdrawn' },
        req,
        target,
      })

      expect(
        (
          await payload.db.count({
            collection: settingsHeadsSlug,
            req,
            where: { branchKey: { exists: true } },
          })
        ).totalDocs,
      ).toBe(2)
      expect((await readBranchHead({ branchID: 1, req, scope, target }))?.branchID).toBe(1)
      expect((await readBranchHead({ branchID: '1', req, scope, target }))?.branchID).toBe('1')
    },
  )

  test.options(
    'should retain an absent incarnation and reject a token from its previous lifetime',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const req = await transactionRequest({ payload })
      const target = { collection: settingsHeadsSlug }
      const initial = await writeBranchHead({
        expected: { branchID: 'drafts', generation: null, scope, state: null },
        nextState: { type: 'withdrawn' },
        req,
        target,
      })
      const previous = {
        branchID: 'drafts',
        generation: initial!.generation,
        incarnation: initial!.incarnation,
        scope,
        state: initial!.state,
      }
      const absent = await discardBranchHead({ expected: previous, req, target })

      expect(absent).toMatchObject({ generation: null, incarnation: 1 })
      expect(await readBranchHead({ branchID: 'drafts', req, scope, target })).toBeNull()
      expect(await readBranchHeadToken({ branchID: 'drafts', req, scope, target })).toStrictEqual(
        absent,
      )
      expect(
        await writeBranchHead({
          expected: { branchID: 'drafts', generation: null, scope, state: null },
          nextState: { type: 'withdrawn' },
          req,
          target,
        }),
      ).toBeNull()

      const recreated = await writeBranchHead({
        expected: absent!,
        nextState: { type: 'withdrawn' },
        req,
        target,
      })

      expect(recreated).toMatchObject({ generation: 1, incarnation: 1 })
      expect(await discardBranchHead({ expected: previous, req, target })).toBeNull()
      expect(
        (
          await payload.db.count({
            collection: settingsHeadsSlug,
            req,
            where: { branchKey: { exists: true } },
          })
        ).totalDocs,
      ).toBe(1)
    },
  )

  test('should refuse ordinary user access to the internal storage', async ({ payload }) => {
    await expect(
      payload.create({
        collection: settingsHeadsSlug,
        data: { branchKey: 'string:main', generation: 1, scopeKey: 'shared', state: 'withdrawn' },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('should reject missing parent IDs and ordinary collections as store targets', async ({
    payload,
  }) => {
    const req = await transactionRequest({ payload })

    await expect(
      readBranchHead({ branchID: 'main', req, scope, target: { collection: articleHeadsSlug } }),
    ).rejects.toThrow('parent identity')
    await expect(
      readBranchHead({ branchID: 'main', req, scope, target: { collection: articlesSlug } }),
    ).rejects.toThrow('registered internal head storage')
  })

  test.options(
    'should reject invalid revisions before writing a head',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      const req = await transactionRequest({ payload })
      const nextState: BranchHeadState = {
        structure: null,
        type: 'version',
        version: { generation: 0, id: 1 },
      }

      await expect(
        writeBranchHead({
          expected: { branchID: 'drafts', generation: null, scope, state: null },
          nextState,
          req,
          target: { collection: settingsHeadsSlug },
        }),
      ).rejects.toThrow('positive safe integers')
      expect(
        (
          await payload.db.count({
            collection: settingsHeadsSlug,
            req,
            where: { branchKey: { exists: true } },
          })
        ).totalDocs,
      ).toBe(0)
    },
  )
})
