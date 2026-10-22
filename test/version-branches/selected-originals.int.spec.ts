/* eslint-disable payload/no-relative-monorepo-imports -- Internal selected context exercised through real public operations. */
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { createSelectedBranchRequest } from '../../packages/payload/src/versions/branches/operations/selectedBranchContext.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { queryBranchGlobal } from '../../packages/payload/src/versions/branches/queries/queryBranchGlobal.js'
import { readBranchHead } from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import {
  articlesSlug,
  localizedStatusArticlesSlug,
  queryDocsSlug,
  scalarArticlesSlug,
  settingsSlug,
} from './slugs.js'

const cleanups: (() => void)[] = []

test.suite(
  'Authoritative branch operation originals',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test.afterEach(() => {
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup()
      }
    })

    test('should refuse a named selection without durable cutover', async ({ payload }) => {
      const source = await createPayloadRequest({ payload })
      const req = createSelectedBranchRequest({ branchID: 'staging', req: source })

      await expect(
        payload.create({ collection: scalarArticlesSlug, data: { title: 'Refused' }, req }),
      ).rejects.toThrow('authoritative cutover')
      expect((await payload.find({ collection: scalarArticlesSlug })).docs).toHaveLength(0)
      expect(source.transactionID).toBeUndefined()
    })

    test('should refuse authority activated after an explicitly observed legacy operation began', async ({
      payload,
    }) => {
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Legacy original', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.hooks.beforeOperation
      let calls = 0
      config.hooks.beforeOperation = [
        ...previous,
        async ({ args, operation, req }) => {
          if (operation === 'update') {
            calls++
            await req.payload.db.create({
              collection: config.custom.branchStorage.cutover,
              req,
              data: {
                singleton: 'authoritative',
                schemaGeneration: 1,
                generation: 1,
                migrationID: 'invalid-mid-operation-cutover',
                isActivated: true,
              },
            })
          }
          return args
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeOperation = previous
      })

      await expect(
        payload.update({
          collection: scalarArticlesSlug,
          id: created.id,
          data: { title: 'Refused' },
          draft: true,
        }),
      ).rejects.toThrow('observations captured before document hooks')
      expect(calls).toBe(1)
      expect(
        (await payload.findByID({ depth: 0, collection: scalarArticlesSlug, id: created.id }))
          .title,
      ).toBe('Legacy original')
      expect(
        await payload.db.findOne({ collection: config.custom.branchStorage.cutover }),
      ).toBeNull()
    })

    test('should refuse authority adopted after selecting legacy bulk candidates', async ({
      payload,
    }) => {
      const first = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'First original', _status: 'published' },
      })
      const second = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Second original', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.hooks.afterChange
      const previousSequential = payload.db.bulkOperationsSingleTransaction
      payload.db.bulkOperationsSingleTransaction = true
      let activations = 0
      config.hooks.afterChange = [
        ...previous,
        async ({ doc, req }) => {
          if (doc.id === first.id) {
            activations++
            await req.payload.db.create({
              collection: config.custom.branchStorage.cutover,
              req,
              data: {
                singleton: 'authoritative',
                schemaGeneration: 1,
                generation: 1,
                migrationID: 'invalid-between-candidates',
                isActivated: true,
              },
            })
          }
          return doc
        },
      ]
      cleanups.push(() => {
        config.hooks.afterChange = previous
        payload.db.bulkOperationsSingleTransaction = previousSequential
      })
      const req = await createPayloadRequest({ payload })
      const transactionID = await payload.db.beginTransaction()
      if (transactionID == null) {
        throw new Error('A caller transaction is required.')
      }
      req.transactionID = transactionID
      try {
        const result = await payload.update({
          collection: scalarArticlesSlug,
          where: { id: { in: [first.id, second.id] } },
          sort: 'id',
          data: { title: 'Changed' },
          draft: true,
          disableTransaction: true,
          req,
        })

        expect(activations).toBe(1)
        expect(result.errors).toEqual([
          expect.objectContaining({
            id: second.id,
            message: 'Branch write authority changed after candidate selection.',
          }),
        ])
      } finally {
        if (req.transactionID !== undefined) {
          await payload.db.rollbackTransaction(transactionID)
          delete req.transactionID
        }
      }
      expect(
        (await payload.findByID({ depth: 0, collection: scalarArticlesSlug, id: second.id })).title,
      ).toBe('Second original')
      expect(
        (await payload.db.find({ collection: config.custom.branchStorage.heads })).docs,
      ).toHaveLength(0)
    })

    test('should keep named published input working and preserve managed drafts latest', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const created = await payload.create({
        collection: articlesSlug,
        data: { shared: 'Main shared', title: 'Main English', _status: 'published' },
        locale: 'en',
      })
      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { shared: 'Draft shared', title: 'Draft English' },
        draft: true,
        locale: 'en',
      })
      const localization = payload.config.localization
      if (!localization) {
        throw new Error('Localized fixture is required.')
      }
      const originalFallback = localization.fallback
      localization.fallback = true
      const namedConfig = payload.collections[articlesSlug]!.config
      const originalHooks = namedConfig.hooks.beforeChange
      const fallbacks: unknown[] = []
      namedConfig.hooks.beforeChange = [
        ...originalHooks,
        ({ data, req }) => {
          fallbacks.push(req.fallbackLocale)
          return data
        },
      ]
      cleanups.push(() => {
        localization.fallback = originalFallback
        namedConfig.hooks.beforeChange = originalHooks
      })
      const source = await createPayloadRequest({ payload, locale: 'en', fallbackLocale: false })
      const req = createSelectedBranchRequest({ branchID: 'staging', req: source })
      const saved = await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Stage English', _status: 'published' },
        req,
      })
      const resaved = await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Stage second' },
        req,
      })

      expect(saved).toMatchObject({
        shared: 'Main shared',
        title: 'Stage English',
        _status: 'draft',
      })
      expect(resaved).toMatchObject({ shared: 'Main shared', title: 'Stage second' })
      expect(
        await payload.findByID({ depth: 0, collection: articlesSlug, id: created.id, draft: true }),
      ).toMatchObject({ shared: 'Draft shared', title: 'Draft English' })
      expect(
        await payload.findByID({ depth: 0, collection: articlesSlug, id: created.id }),
      ).toMatchObject({
        shared: 'Main shared',
        title: 'Main English',
      })
      expect(req.transactionID).toBeUndefined()
      expect(source.transactionID).toBeUndefined()
      expect(source.locale).toBe('en')
      expect(source.fallbackLocale).toBe(false)
      expect(fallbacks).toEqual([false, false])
    })

    test('should isolate a named-created identity in effective projection views', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Only staging', _status: 'published' },
        req,
      })
      const views = []
      for (const branchID of ['main', 'drafts', 'staging']) {
        views.push(
          await queryBranchContent({
            branchID,
            collection: scalarArticlesSlug,
            req: await createPayloadRequest({ payload }),
            overrideAccess: true,
            where: { id: { equals: created.id } },
          }),
        )
      }

      expect(views[0]!.docs).toHaveLength(0)
      expect(views[1]!.docs).toHaveLength(0)
      expect(views[2]!.docs[0]).toMatchObject({
        id: created.id,
        title: 'Only staging',
        _status: 'draft',
      })
    })

    test('should authorize update once against selected originals even when read access denies', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Stage' },
        req,
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const original = config.access
      let count = 0
      config.access = {
        ...original,
        read: () => false,
        update: () => {
          count++
          return { title: { equals: 'Stage' } }
        },
      }
      cleanups.push(() => {
        config.access = original
      })
      const saved = await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Authorized' },
        req,
        overrideAccess: false,
      })

      expect(count).toBe(1)
      expect(saved.title).toBe('Authorized')
    })

    test('should avoid unnecessary root read callbacks during a permitted update', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const original = config.access.read
      config.access.read = () => {
        throw new Error('Unexpected read callback')
      }
      cleanups.push(() => {
        config.access.read = original
      })
      const result = await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Permitted' },
        draft: true,
        overrideAccess: false,
      })

      expect(result.title).toBe('Permitted')
    })

    test('should separate trusted update-policy hops from user self-relation predicates', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 2, title: 'Private target', _status: 'published' },
        depth: 0,
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 1, title: 'Root', one: 2, _status: 'published' },
        depth: 0,
      })
      const config = payload.collections[queryDocsSlug]!.config
      const original = config.access
      config.access = {
        ...original,
        read: () => ({ id: { equals: 1 } }),
        update: () => ({ 'one.title': { equals: 'Private target' } }),
      }
      cleanups.push(() => {
        config.access = original
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const result = await payload.update({
        collection: queryDocsSlug,
        id: 1,
        data: { title: 'Allowed policy' },
        req,
        depth: 0,
        overrideAccess: false,
      })
      const filtered = await payload.update({
        collection: queryDocsSlug,
        where: { 'one.title': { equals: 'Private target' } },
        data: { title: 'Refused predicate' },
        req,
        depth: 0,
        overrideAccess: false,
      })

      expect(result.title).toBe('Allowed policy')
      expect(filtered.docs).toHaveLength(0)
      expect(filtered.errors).toHaveLength(0)
    })

    test('should select bulk membership and limits from authoritative branch content', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const first = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main A', _status: 'published' },
      })
      const second = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main B', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: first.id,
        data: { title: 'Stage B' },
        req,
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: second.id,
        data: { title: 'Stage A' },
        req,
      })
      const result = await payload.update({
        collection: scalarArticlesSlug,
        where: { title: { contains: 'Stage' } },
        limit: 1,
        sort: 'title',
        data: { title: 'Selected' },
        req,
      })

      expect(result.errors).toHaveLength(0)
      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]!.id).toBe(second.id)
    })

    test('should retain operation locale when policy checks a localized selected original', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const created = await payload.create({
        collection: articlesSlug,
        data: { title: 'English', shared: 'Shared', _status: 'published' },
        locale: 'en',
      })
      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Francais' },
        draft: true,
        locale: 'fr',
      })
      const config = payload.collections[articlesSlug]!.config
      const original = config.access.update
      config.access.update = () => ({ title: { equals: 'Francais' } })
      cleanups.push(() => {
        config.access.update = original
      })
      const result = await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: 'Nouveau' },
        draft: true,
        locale: 'fr',
        overrideAccess: false,
      })

      expect(result.title).toBe('Nouveau')
      expect(
        await payload.findByID({
          depth: 0,
          collection: articlesSlug,
          id: created.id,
          locale: 'en',
        }),
      ).toMatchObject({ title: 'English' })
    })

    test('should retain explicit trusted override for related read policies', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 2, title: 'Target', _status: 'published' },
        depth: 0,
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 1, title: 'Root', one: 2, _status: 'published' },
        depth: 0,
      })
      const config = payload.collections[queryDocsSlug]!.config
      const original = config.access.read
      config.access.read = () => {
        throw new Error('Unexpected trusted read policy')
      }
      cleanups.push(() => {
        config.access.read = original
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const result = await payload.update({
        collection: queryDocsSlug,
        where: { 'one.title': { equals: 'Target' } },
        data: { title: 'Trusted' },
        overrideAccess: true,
        req,
        depth: 0,
      })

      expect(result.errors).toHaveLength(0)
      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]!.id).toBe(1)
    })

    test('should keep an explicit managed drafts selection working for published input', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'drafts',
        req: await createPayloadRequest({ payload }),
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Working', _status: 'published' },
        req,
      })

      expect(
        await payload.findByID({ depth: 0, collection: scalarArticlesSlug, id: created.id }),
      ).toMatchObject({ title: 'Main' })
      expect(
        await payload.findByID({
          depth: 0,
          collection: scalarArticlesSlug,
          id: created.id,
          draft: true,
        }),
      ).toMatchObject({ title: 'Working', _status: 'draft' })
    })

    test('should preserve native untranslated status presence in authoritative bulk originals', async ({
      payload,
    }) => {
      await activateEmpty({ collection: localizedStatusArticlesSlug, payload })
      const created = await payload.create({
        collection: localizedStatusArticlesSlug,
        data: { title: 'English only', shared: 'Before', _status: 'published' },
        locale: 'en',
        publishAllLocales: false,
      })
      const native = await payload.db.findOne({
        collection: localizedStatusArticlesSlug,
        locale: 'all',
        where: { id: { equals: created.id } },
      })
      const config = payload.collections[localizedStatusArticlesSlug]!.config
      const previous = config.hooks.beforeChange
      const originals: Record<string, unknown>[] = []
      config.hooks.beforeChange = [
        ...previous,
        ({ data, originalDoc }) => {
          originals.push(structuredClone(originalDoc))
          return data
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeChange = previous
      })
      const result = await payload.update({
        collection: localizedStatusArticlesSlug,
        where: { id: { equals: created.id } },
        data: { shared: 'After' },
        draft: true,
        locale: 'all',
      })

      expect(result.errors).toHaveLength(0)
      expect(originals).toHaveLength(1)
      expect(originals[0]!._status).toEqual(native!._status)
      expect(originals[0]!.updatedAt).toEqual(native!.updatedAt)
      expect(Object.hasOwn(originals[0]!._status as object, 'fr')).toBe(
        Object.hasOwn(native!._status as object, 'fr'),
      )
      expect((result.docs[0]!._status as Record<string, string>).en).toBe(
        (native!._status as Record<string, string>).en,
      )
      expect(
        await payload.findByID({
          collection: localizedStatusArticlesSlug,
          id: created.id,
          locale: 'en',
          depth: 0,
        }),
      ).toMatchObject({ title: 'English only', _status: 'published' })
    })

    for (const locale of ['en', 'fr', 'all']) {
      test(`should preserve native localized status shape in ${locale} by-ID originals`, async ({
        payload,
      }) => {
        await activateEmpty({ collection: localizedStatusArticlesSlug, payload })
        const created = await payload.create({
          collection: localizedStatusArticlesSlug,
          data: { title: 'English only', _status: 'published' },
          locale: 'en',
          publishAllLocales: false,
        })
        const expected = await payload.findByID({
          collection: localizedStatusArticlesSlug,
          id: created.id,
          locale,
          fallbackLocale: false,
          depth: 0,
        })
        const config = payload.collections[localizedStatusArticlesSlug]!.config
        const previous = config.hooks.beforeChange
        const originals: Record<string, unknown>[] = []
        config.hooks.beforeChange = [
          ...previous,
          ({ data, originalDoc }) => {
            originals.push(structuredClone(originalDoc))
            return data
          },
        ]
        cleanups.push(() => {
          config.hooks.beforeChange = previous
        })
        await payload.update({
          collection: localizedStatusArticlesSlug,
          id: created.id,
          data: { shared: 'Changed' },
          draft: true,
          locale,
          fallbackLocale: false,
        })

        expect(originals).toHaveLength(1)
        expect(originals[0]!._status).toEqual(expected._status)
        expect(originals[0]!.title).toEqual(expected.title)
        expect(originals[0]!.updatedAt).toEqual(expected.updatedAt)
      })
    }

    test('should characterize legacy all-locale shared draft response status', async ({
      payload,
    }) => {
      const created = await payload.create({
        collection: localizedStatusArticlesSlug,
        data: { title: 'English only', _status: 'published' },
        locale: 'en',
        publishAllLocales: false,
      })
      const result = await payload.update({
        collection: localizedStatusArticlesSlug,
        where: { id: { equals: created.id } },
        data: { shared: 'After' },
        draft: true,
        locale: 'all',
      })

      expect((result.docs[0]!._status as Record<string, string>).en).toBe('published')
    })

    test('should retain an explicitly withdrawn locale status with an unchanged shared head', async ({
      payload,
    }) => {
      await activateEmpty({ collection: localizedStatusArticlesSlug, payload })
      const created = await payload.create({
        collection: localizedStatusArticlesSlug,
        data: { title: 'English', _status: 'published' },
        locale: 'en',
        publishAllLocales: false,
      })
      const headArgs = {
        branchID: 'main',
        req: await createPayloadRequest({ payload }),
        scope: { type: 'shared' as const },
        target: {
          collection:
            payload.collections[localizedStatusArticlesSlug]!.config.custom.branchStorage.heads,
          parentID: created.id,
        },
      }
      const sharedBefore = await readBranchHead(headArgs)
      await payload.update({
        collection: localizedStatusArticlesSlug,
        id: created.id,
        data: { _status: 'draft' },
        locale: 'fr',
        publishAllLocales: false,
      })
      expect(await readBranchHead(headArgs)).toEqual(sharedBefore)
      const native = await payload.findByID({
        collection: localizedStatusArticlesSlug,
        id: created.id,
        locale: 'all',
        depth: 0,
      })
      const config = payload.collections[localizedStatusArticlesSlug]!.config
      const previous = config.hooks.beforeChange
      const originals: Record<string, unknown>[] = []
      config.hooks.beforeChange = [
        ...previous,
        ({ data, originalDoc }) => {
          originals.push(structuredClone(originalDoc))
          return data
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeChange = previous
      })
      await payload.update({
        collection: localizedStatusArticlesSlug,
        id: created.id,
        data: { shared: 'Working' },
        locale: 'all',
        draft: true,
      })

      expect((native._status as Record<string, string>).fr).toBe('draft')
      expect(originals[0]!._status).toEqual(native._status)
      expect(originals[0]!.updatedAt).toEqual(native.updatedAt)
      expect(Object.hasOwn(originals[0]!._status as object, 'fr')).toBe(true)
    })

    test('should retain fully owned staging timestamps when unrelated main content advances', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const created = await payload.create({
        collection: articlesSlug,
        data: { title: 'Main', shared: 'Main shared', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload, locale: 'all' }),
      })
      const staged = await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { title: { en: 'Stage English', fr: 'Stage French' }, shared: 'Stage shared' },
        req,
      })
      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { shared: 'Main advanced' },
      })
      const config = payload.collections[articlesSlug]!.config
      const previous = config.hooks.beforeChange
      const originals: Record<string, unknown>[] = []
      config.hooks.beforeChange = [
        ...previous,
        ({ data, originalDoc }) => {
          originals.push(structuredClone(originalDoc))
          return data
        },
      ]
      cleanups.push(() => {
        config.hooks.beforeChange = previous
      })
      await payload.update({
        collection: articlesSlug,
        id: created.id,
        data: { shared: 'Stage final' },
        req,
      })

      expect(originals[0]!.updatedAt).toEqual(staged.updatedAt)
      expect(originals[0]!.shared).toBe('Stage shared')
    })

    test('should preserve a bulk delete access predicate when staging a trash operation', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Protected', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previousTrash = config.trash
      const previousDelete = config.access.delete
      config.trash = true
      config.access.delete = () => ({ title: { equals: 'Not authorized' } })
      cleanups.push(() => {
        config.trash = previousTrash
        config.access.delete = previousDelete
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const result = await payload.update({
        collection: scalarArticlesSlug,
        where: { id: { equals: created.id } },
        data: { deletedAt: new Date().toISOString() },
        trash: true,
        overrideAccess: false,
        req,
      })

      expect(result.errors).toHaveLength(0)
      expect(result.docs).toHaveLength(0)
    })

    test('should deny a named global update policy without relying on native singleton existence', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      await activateEmpty({ collection: queryDocsSlug, payload })
      await activateEmpty({ global: settingsSlug, payload })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.updateGlobal({ slug: settingsSlug, data: { title: 'Staging original' }, req })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.update
      config.access.update = () => ({ title: { equals: 'Not authorized' } })
      cleanups.push(() => {
        config.access.update = previous
      })

      await expect(
        payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'Refused' },
          overrideAccess: false,
          req,
        }),
      ).rejects.toThrow()
    })

    test('should refuse missing authoritative global heads for retained legacy history', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Existing history' },
        draft: true,
      })
      await activateEmpty({ global: settingsSlug, payload })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })

      await expect(
        payload.updateGlobal({ slug: settingsSlug, data: { title: 'Refused' }, req }),
      ).rejects.toThrow('heads are missing')
    })

    test('should characterize native legacy global draft update identity presence', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Legacy first' },
        draft: true,
      })
      const result = await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Legacy second' },
        draft: true,
      })

      expect(Object.hasOwn(result, 'id')).toBe(true)
      expect(result.id).toBeUndefined()
    })

    for (const isAuthoritative of [false, true]) {
      test(`should preserve materialized global identity boundaries with authority ${isAuthoritative}`, async ({
        payload,
      }) => {
        if (isAuthoritative) {
          await activateEmpty({ collection: articlesSlug, payload })
          await activateEmpty({ collection: queryDocsSlug, payload })
          await activateEmpty({ global: settingsSlug, payload })
        }
        await payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'Live global', _status: 'published' },
        })
        const native = await payload.findGlobal({ slug: settingsSlug, depth: 0 })
        const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
        const previous = config.hooks.beforeChange
        const originals: Record<string, unknown>[] = []
        config.hooks.beforeChange = [
          ...previous,
          ({ data, originalDoc }) => {
            originals.push(structuredClone(originalDoc))
            return data
          },
        ]
        cleanups.push(() => {
          config.hooks.beforeChange = previous
        })
        const req = isAuthoritative
          ? createSelectedBranchRequest({
              branchID: 'staging',
              req: await createPayloadRequest({ payload }),
            })
          : undefined
        const result = await payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'Working global' },
          draft: true,
          req,
        })

        expect(Object.hasOwn(native, 'id')).toBe(true)
        expect(native.id).toBeDefined()
        expect(Object.hasOwn(originals[0]!, 'id')).toBe(false)
        expect(Object.hasOwn(result, 'id')).toBe(true)
        expect(result.id).toBeUndefined()
        expect((await payload.findGlobal({ slug: settingsSlug, depth: 0 })).id).toEqual(native.id)
      })
    }

    test('should preserve selected global originals before any materialized singleton', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      await activateEmpty({ collection: queryDocsSlug, payload })
      await activateEmpty({ global: settingsSlug, payload })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload, locale: 'en' }),
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Stage global', shared: 'Stage shared' },
        req,
      })
      const result = await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Stage second' },
        req,
      })

      expect(result).toMatchObject({
        title: 'Stage second',
        shared: 'Stage shared',
        _status: 'draft',
      })
      expect(Object.hasOwn(result, 'id')).toBe(true)
      expect(result.id).toBeUndefined()
      const raw = await payload.db.findGlobal({ slug: settingsSlug })
      expect(!raw || Object.keys(raw).length === 0).toBe(true)
    })

    for (const isStagingFirst of [false, true]) {
      test(`should retain independent initial globals when staging first is ${isStagingFirst}`, async ({
        payload,
      }) => {
        await activateEmpty({ collection: articlesSlug, payload })
        await activateEmpty({ collection: queryDocsSlug, payload })
        await activateEmpty({ global: settingsSlug, payload })
        const req = createSelectedBranchRequest({
          branchID: 'staging',
          req: await createPayloadRequest({ payload }),
        })
        const saveDrafts = () =>
          payload.updateGlobal({
            slug: settingsSlug,
            data: { title: 'Managed initial', shared: 'Managed shared' },
            draft: true,
          })
        const saveStaging = () =>
          payload.updateGlobal({
            slug: settingsSlug,
            data: { title: 'Staging initial', shared: 'Staging shared' },
            req,
          })
        if (isStagingFirst) {
          await saveStaging()
          await saveDrafts()
        } else {
          await saveDrafts()
          await saveStaging()
        }
        const staged = await payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'Staging second' },
          req,
        })
        const managed = await payload.updateGlobal({
          slug: settingsSlug,
          data: { title: 'Managed second' },
          draft: true,
        })

        expect(staged).toMatchObject({ title: 'Staging second', shared: 'Staging shared' })
        expect(managed).toMatchObject({ title: 'Managed second', shared: 'Managed shared' })
        expect(
          (await payload.findGlobal({ slug: settingsSlug, draft: true, depth: 0 })).title,
        ).toBe('Managed second')
        const native = await payload.db.findGlobal({ slug: settingsSlug })
        expect(!native || Object.keys(native).length === 0).toBe(true)
        expect(
          await queryBranchGlobal({
            branchID: 'main',
            global: settingsSlug,
            req: await createPayloadRequest({ payload }),
            overrideAccess: true,
          }),
        ).toBeNull()
      })
    }

    test('should keep main global projection unavailable after every locale is withdrawn', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      await activateEmpty({ collection: queryDocsSlug, payload })
      await activateEmpty({ global: settingsSlug, payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Live global', _status: 'published' },
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { _status: 'draft' },
        unpublishAllLocales: true,
      })

      expect(
        await queryBranchGlobal({
          branchID: 'main',
          global: settingsSlug,
          req: await createPayloadRequest({ payload }),
          overrideAccess: true,
        }),
      ).toBeNull()
    })

    test('should preserve caller transaction and roll back selected working changes', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main', _status: 'published' },
      })
      const transactionID = await payload.db.beginTransaction()
      if (transactionID == null) {
        throw new Error('A native caller transaction is required.')
      }
      const source = await createPayloadRequest({ payload })
      source.transactionID = transactionID
      const req = createSelectedBranchRequest({ branchID: 'staging', req: source })
      try {
        await payload.update({
          collection: scalarArticlesSlug,
          id: created.id,
          data: { title: 'Rolled back' },
          req,
        })
        expect(source.transactionID).toBe(transactionID)
        expect(req.transactionID).toBe(transactionID)
      } finally {
        await payload.db.rollbackTransaction(transactionID)
      }
      const view = await queryBranchContent({
        branchID: 'staging',
        collection: scalarArticlesSlug,
        overrideAccess: true,
        req: await createPayloadRequest({ payload }),
        where: { id: { equals: created.id } },
      })
      expect(view.docs[0]!.title).toBe('Main')
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
    for (const branchID of ['main', 'drafts', 'staging']) {
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
