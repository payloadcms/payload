/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the internal, cutover-gated write engine through public operations. */
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { readBranchHead } from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { articleHeadsSlug, articlesSlug, scalarArticlesSlug, settingsSlug } from './slugs.js'

const cleanups: (() => void)[] = []

test.suite(
  'Version-backed working-write persistence',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test.afterEach(() => {
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup()
      }
    })

    test('should preserve legacy drafts for arbitrary user keys without durable cutover', async ({
      payload,
    }) => {
      const config = payload.collections[articlesSlug]!.config
      const previous = config.custom.branchHeadEngine

      config.custom.branchHeadEngine = true
      cleanups.push(() => {
        config.custom.branchHeadEngine = previous
      })

      const created = await payload.create({
        collection: articlesSlug,
        data: { title: 'Legacy draft' },
        draft: true,
      })
      const heads = await payload.db.find({ collection: articleHeadsSlug })

      expect(created).toMatchObject({ title: 'Legacy draft', _status: 'draft' })
      expect(heads.docs).toHaveLength(0)
    })

    test('should refuse an existing unsupported receipt instead of falling back to legacy', async ({
      payload,
    }) => {
      const config = payload.collections[scalarArticlesSlug]!.config

      await payload.db.create({
        collection: config.custom.branchStorage.cutover,
        data: {
          singleton: 'authoritative',
          schemaGeneration: 2,
          generation: 1,
          migrationID: 'unsupported-schema',
          isActivated: true,
        },
      })
      await expect(
        payload.create({ collection: scalarArticlesSlug, data: { title: 'Refused' }, draft: true }),
      ).rejects.toThrow('inactive or unsupported')
      expect((await payload.find({ collection: scalarArticlesSlug })).docs).toHaveLength(0)
    })

    test('should refuse a cutover revoked by an application hook and roll back the write', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.hooks.beforeChange

      config.hooks.beforeChange = [
        ...previous,
        async ({ data, req }) => {
          await payload.db.updateOne({
            collection: config.custom.branchStorage.cutover,
            data: { isActivated: false, generation: 2 },
            req,
            where: { singleton: { equals: 'authoritative' } },
          })
          return data
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeChange = previous
      })

      await expect(
        payload.update({
          collection: scalarArticlesSlug,
          id: created.id,
          data: { title: 'Refused' },
          draft: true,
        }),
      ).rejects.toThrow('Authoritative branch cutover changed')

      const cutover = await payload.db.findOne({
        collection: config.custom.branchStorage.cutover,
        where: { singleton: { equals: 'authoritative' } },
      })

      expect(cutover).toMatchObject({ isActivated: true, generation: 1 })
      expect(
        (
          await payload.findVersions({
            collection: scalarArticlesSlug,
            where: { 'version.title': { equals: 'Refused' } },
          })
        ).docs,
      ).toHaveLength(0)
    })

    test('should persist a public draft create with logical identity and canonical head content', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })

      const created = await payload.create({
        collection: articlesSlug,
        data: {
          shared: 'Shared',
          title: 'Draft title',
          sections: [{ label: 'Row', translation: 'Translation' }],
        },
        draft: true,
        locale: 'en',
      })
      const req = await createPayloadRequest({ payload, locale: 'en' })
      const result = await queryBranchContent({
        branchID: 'drafts',
        collection: articlesSlug,
        overrideAccess: true,
        req,
        locale: 'en',
      })
      const main = await queryBranchContent({
        branchID: 'main',
        collection: articlesSlug,
        overrideAccess: true,
        req,
        locale: 'en',
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]).toMatchObject({
        id: created.id,
        shared: 'Shared',
        title: { en: 'Draft title' },
        _status: { en: 'draft', fr: 'draft' },
      })
      expect(result.docs[0]!.sections).toEqual([
        { ...created.sections![0], translation: { en: 'Translation' } },
      ])
      expect(main.docs).toHaveLength(0)
      expect(await payload.findByID({ collection: articlesSlug, id: created.id })).toMatchObject({
        id: created.id,
      })
    })

    test('should leave main unchanged while public update hooks run once for working content', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const originalBefore = config.hooks.beforeChange
      const originalAfter = config.hooks.afterChange
      let beforeCount = 0
      let afterCount = 0

      config.hooks.beforeChange = [
        ...originalBefore,
        ({ data }) => {
          beforeCount++
          return data
        },
      ]
      config.hooks.afterChange = [
        ...originalAfter,
        ({ doc }) => {
          afterCount++
          return doc
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeChange = originalBefore
        config.hooks.afterChange = originalAfter
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Working' },
        draft: true,
      })

      const req = await createPayloadRequest({ payload })
      const main = await queryBranchContent({
        branchID: 'main',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })
      const working = await queryBranchContent({
        branchID: 'drafts',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })

      expect(main.docs[0]).toMatchObject({ id: created.id, title: 'Live' })
      expect(working.docs[0]).toMatchObject({ id: created.id, title: 'Working' })
      expect(
        await payload.findByID({ collection: scalarArticlesSlug, id: created.id }),
      ).toMatchObject({ title: 'Live' })
      expect({ afterCount, beforeCount }).toEqual({ afterCount: 1, beforeCount: 1 })
    })

    test('should roll back working heads with the original caller transaction', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })
      const req = await createPayloadRequest({ payload })
      const transactionID = await payload.db.beginTransaction()

      if (transactionID == null) {
        throw new Error('A real caller transaction is required.')
      }
      req.transactionID = transactionID

      try {
        await payload.update({
          collection: scalarArticlesSlug,
          id: created.id,
          data: { title: 'Uncommitted working' },
          draft: true,
          req,
        })
      } finally {
        await payload.db.rollbackTransaction(transactionID)
      }
      const readReq = await createPayloadRequest({ payload })
      const result = await queryBranchContent({
        branchID: 'drafts',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req: readReq,
      })

      expect(result.docs[0]).toMatchObject({ title: 'Live' })
      expect(
        (
          await payload.findVersions({
            collection: scalarArticlesSlug,
            where: { 'version.title': { equals: 'Uncommitted working' } },
          })
        ).docs,
      ).toHaveLength(0)
    })

    test('should reject stale pre-hook observations and roll back nested working edits', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.hooks.beforeChange
      let isNested = false
      let outerCalls = 0

      config.hooks.beforeChange = [
        ...previous,
        async ({ data, req }) => {
          if (!isNested) {
            outerCalls++
            isNested = true
            try {
              await payload.update({
                collection: scalarArticlesSlug,
                id: created.id,
                data: { title: 'Nested working' },
                draft: true,
                req,
              })
            } finally {
              isNested = false
            }
          }
          return data
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeChange = previous
      })

      await expect(
        payload.update({
          collection: scalarArticlesSlug,
          id: created.id,
          data: { title: 'Outer working' },
          draft: true,
        }),
      ).rejects.toThrow('Branch batch observation changed')

      const req = await createPayloadRequest({ payload })
      const result = await queryBranchContent({
        branchID: 'drafts',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })

      expect(result.docs[0]).toMatchObject({ title: 'Live' })
      expect(outerCalls).toBe(1)
      expect(
        (
          await payload.findVersions({
            collection: scalarArticlesSlug,
            where: { 'version.title': { in: ['Outer working', 'Nested working'] } },
          })
        ).docs,
      ).toHaveLength(0)
    })

    test('should preserve an existing working override base after main advances', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })

      const created = await payload.create({
        collection: articlesSlug,
        data: { title: 'Live one', _status: 'published' },
        locale: 'en',
      })

      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Draft one' },
        draft: true,
        locale: 'en',
      })

      const req = await createPayloadRequest({ payload })
      const target = { collection: articleHeadsSlug, parentID: created.id }
      const scope = { type: 'locale' as const, locale: 'en' }
      const original = await readBranchHead({ branchID: 'drafts', req, scope, target })

      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Live two', _status: 'published' },
        locale: 'en',
      })
      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Draft two' },
        draft: true,
        locale: 'en',
      })

      const resaved = await readBranchHead({ branchID: 'drafts', req, scope, target })

      expect(original!.base).not.toBeNull()
      expect(resaved!.base).toEqual(original!.base)
    })

    test('should snapshot actual live content instead of sibling working translations', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })

      const created = await payload.create({
        collection: articlesSlug,
        data: { title: 'Live English', shared: 'Live shared', _status: 'published' },
        locale: 'en',
      })

      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Working French' },
        draft: true,
        locale: 'fr',
      })
      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'New English', _status: 'published' },
        locale: 'en',
      })

      const req = await createPayloadRequest({ payload })
      const head = await readBranchHead({
        branchID: 'main',
        req,
        scope: { type: 'locale', locale: 'en' },
        target: { collection: articleHeadsSlug, parentID: created.id },
      })

      expect(head!.state.type).toBe('version')

      if (head!.state.type !== 'version') {
        throw new Error('A publication must select a version.')
      }
      const stored = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: head!.state.version.id } },
      })
      const native = await payload.db.findOne({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: created.id } },
      })

      expect(stored.docs[0]!.version.title).toEqual(native!.title)
      expect(stored.docs[0]!.version.shared).toEqual(native!.shared)
      expect((stored.docs[0]!.version.title as Record<string, unknown>).fr).not.toBe(
        'Working French',
      )
      expect(stored.docs[0]!.branchOnly).toBe(true)
    })

    test('should restore historical working content without altering main', async ({ payload }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Historical draft' },
        draft: true,
      })

      const history = await payload.findVersions({
        collection: scalarArticlesSlug,
        where: { parent: { equals: created.id }, 'version.title': { equals: 'Historical draft' } },
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Newer draft' },
        draft: true,
      })
      await payload.restoreVersion({
        collection: scalarArticlesSlug,
        id: history.docs[0]!.id,
        draft: true,
      })

      const req = await createPayloadRequest({ payload })
      const main = await queryBranchContent({
        branchID: 'main',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })
      const working = await queryBranchContent({
        branchID: 'drafts',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })

      expect(main.docs[0]).toMatchObject({ title: 'Live' })
      expect(working.docs[0]).toMatchObject({ title: 'Historical draft' })
    })

    test('should capture restore heads before an update access callback performs a nested write', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Historical draft' },
        draft: true,
      })

      const history = await payload.findVersions({
        collection: scalarArticlesSlug,
        where: { parent: { equals: created.id }, 'version.title': { equals: 'Historical draft' } },
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Current draft' },
        draft: true,
      })

      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.access.update
      let accessCalls = 0
      let isNested = false

      config.access.update = async ({ req }) => {
        if (isNested) {
          return true
        }
        accessCalls++
        isNested = true
        try {
          await payload.update({
            collection: scalarArticlesSlug,
            id: created.id,
            data: { title: 'Nested access edit' },
            draft: true,
            req,
          })
        } finally {
          isNested = false
        }
        return true
      }
      cleanups.push(() => {
        config.access.update = previous
      })

      await expect(
        payload.restoreVersion({
          collection: scalarArticlesSlug,
          id: history.docs[0]!.id,
          draft: true,
          overrideAccess: false,
        }),
      ).rejects.toThrow('Branch batch observation changed')

      const req = await createPayloadRequest({ payload })
      const working = await queryBranchContent({
        branchID: 'drafts',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })

      expect(working.docs[0]).toMatchObject({ title: 'Current draft' })
      expect(accessCalls).toBe(1)
      expect(
        (
          await payload.findVersions({
            collection: scalarArticlesSlug,
            where: { 'version.title': { equals: 'Nested access edit' } },
          })
        ).docs,
      ).toHaveLength(0)
    })

    test('should retain head roots while pruning unprotected history', async ({ payload }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })

      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.versions

      config.versions = { ...config.versions, maxPerDoc: 1 } as typeof config.versions
      cleanups.push(() => {
        config.versions = previous
      })

      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })

      const retainedHistory = await payload.findVersions({
        collection: scalarArticlesSlug,
        where: { parent: { equals: created.id } },
      })
      const garbage = await payload.db.createVersion({
        collectionSlug: scalarArticlesSlug,
        parent: created.id,
        branchMode: true,
        createdAt: '2018-01-01T00:00:00.000Z',
        updatedAt: '2018-01-01T00:00:00.000Z',
        versionData: { title: 'Unprotected old snapshot' },
      })

      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Draft one' },
        draft: true,
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Draft two' },
        draft: true,
      })

      const req = await createPayloadRequest({ payload })
      const main = await queryBranchContent({
        branchID: 'main',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })
      const working = await queryBranchContent({
        branchID: 'drafts',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req,
      })

      expect(
        (
          await payload.db.findVersions({
            collection: scalarArticlesSlug,
            where: { id: { equals: garbage.id } },
          })
        ).docs,
      ).toHaveLength(0)
      expect(
        (
          await payload.db.findVersions({
            collection: scalarArticlesSlug,
            where: { id: { equals: retainedHistory.docs[0]!.id } },
          })
        ).docs,
      ).toHaveLength(1)
      expect(main.docs[0]).toMatchObject({ title: 'Live' })
      expect(working.docs[0]).toMatchObject({ title: 'Draft two' })
      expect(
        (
          await payload.findVersions({
            collection: scalarArticlesSlug,
            where: { parent: { equals: created.id } },
          })
        ).docs.length,
      ).toBeGreaterThan(1)
    })

    test('should persist the first global draft without creating an ordinary singleton', async ({
      payload,
    }) => {
      await activateEmpty({ global: settingsSlug, payload })

      const updated = await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'First draft' },
        draft: true,
        locale: 'en',
      })
      const native = await payload.db.findGlobal({ slug: settingsSlug })
      const versions = await payload.findGlobalVersions({ slug: settingsSlug, locale: 'all' })

      expect(updated).toMatchObject({ title: 'First draft' })
      expect(native?.id).toBeUndefined()
      expect(versions.docs[0]).toMatchObject({ version: { title: { en: 'First draft' } } })
      expect(versions.docs[0]).not.toHaveProperty('branchGeneration')
    })
  },
)

const activateEmpty = async ({
  collection,
  global,
  payload,
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
      migrationID: 'test-empty-source',
      generation: 1,
      isActivated: true,
    },
  })
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID == null) {
    throw new Error('Working-write integration requires native caller transactions.')
  }
  req.transactionID = transactionID

  try {
    for (const branchID of ['main', 'drafts']) {
      await bootstrapBranchProjectionPage({
        branchID,
        collection: config.custom.branchStorage.heads,
        req,
      })
    }
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
