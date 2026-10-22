/* eslint-disable payload/no-relative-monorepo-imports -- Verify internal selection through public collection reads. */
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { createBranchReadIntent } from '../../packages/payload/src/versions/branches/operations/branchReadContext.js'
import { createSelectedBranchRequest } from '../../packages/payload/src/versions/branches/operations/selectedBranchContext.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import {
  localizedStatusArticlesSlug,
  nestedReadArticlesSlug,
  queryDocsSlug,
  queryTagsSlug,
  readVirtualTagsSlug,
  scalarArticlesSlug,
  wideIDsSlug,
} from './slugs.js'

const cleanups: (() => void)[] = []

test.suite(
  'Authoritative public collection reads',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test.afterEach(() => {
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup()
      }
    })
    test('should preserve the ordinary managed anchor after later draft saves', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Anchor A' },
        draft: true,
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Draft B' },
        draft: true,
      })
      const ordinary = await payload.findByID({
        collection: scalarArticlesSlug,
        id: created.id,
        depth: 0,
      })
      const draft = await payload.findByID({
        collection: scalarArticlesSlug,
        id: created.id,
        depth: 0,
        draft: true,
      })
      expect(ordinary.title).toBe('Anchor A')
      expect(draft.title).toBe('Draft B')
      expect(
        (
          await payload.find({
            collection: scalarArticlesSlug,
            depth: 0,
            where: { title: { equals: 'Anchor A' } },
          })
        ).docs.map((doc) => doc.id),
      ).toEqual([created.id])
      expect(
        await payload.count({
          collection: scalarArticlesSlug,
          where: { title: { equals: 'Anchor A' } },
        }),
      ).toEqual({ totalDocs: 1 })
      expect(
        (await payload.findDistinct({ collection: scalarArticlesSlug, field: 'title' })).values,
      ).toEqual([{ title: 'Anchor A' }])
      expect(
        (
          await queryBranchContent({
            branchID: 'main',
            collection: scalarArticlesSlug,
            overrideAccess: true,
            req: await createPayloadRequest({ payload }),
          })
        ).docs,
      ).toEqual([])
    })
    for (const collection of [scalarArticlesSlug, localizedStatusArticlesSlug]) {
      test(`should correlate root policies through the native schema for ${collection}`, async ({
        payload,
      }) => {
        await activateEmpty({ collection, payload })
        const allowed = await payload.create({
          collection,
          data: { title: 'Allowed main', _status: 'published' },
        })
        const denied = await payload.create({
          collection,
          data: { title: 'Denied main', _status: 'published' },
        })
        const req = createSelectedBranchRequest({
          branchID: 'staging',
          req: await createPayloadRequest({ payload }),
        })

        await payload.update({
          collection,
          id: allowed.id,
          data: { title: 'Allowed staging' },
          req,
        })
        await payload.update({ collection, id: denied.id, data: { title: 'Denied staging' }, req })

        const config = payload.collections[collection]!.config
        const previous = config.access.read
        let accessCalls = 0

        config.access.read = () => {
          accessCalls++
          return { id: { equals: allowed.id } }
        }
        cleanups.push(() => {
          config.access.read = previous
        })

        const selected = await payload.find({ collection, depth: 0, overrideAccess: false, req })
        const ordinary = await payload.find({ collection, depth: 0, overrideAccess: false })

        expect(selected.docs.map(({ id, title }) => ({ id, title }))).toEqual([
          { id: allowed.id, title: 'Allowed staging' },
        ])
        expect(selected.totalDocs).toBe(1)
        expect(ordinary.docs.map(({ id, title }) => ({ id, title }))).toEqual([
          { id: allowed.id, title: 'Allowed main' },
        ])
        expect(ordinary.totalDocs).toBe(1)
        expect(accessCalls).toBe(2)
      })
    }
    test('should hide actual named-only native anchors from ordinary reads and aggregates', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Named anchor' },
        req,
      })
      expect(
        await payload.db.findOne({
          collection: scalarArticlesSlug,
          where: { id: { equals: created.id } },
        }),
      ).toBeTruthy()
      expect(
        await payload.findByID({
          collection: scalarArticlesSlug,
          id: created.id,
          depth: 0,
          disableErrors: true,
        }),
      ).toBeNull()
      expect((await payload.find({ collection: scalarArticlesSlug, depth: 0 })).docs).toEqual([])
      expect(await payload.count({ collection: scalarArticlesSlug })).toEqual({ totalDocs: 0 })
      expect(
        (await payload.findDistinct({ collection: scalarArticlesSlug, field: 'title' })).values,
      ).toEqual([])
      expect(
        (await payload.findByID({ collection: scalarArticlesSlug, id: created.id, depth: 0, req }))
          .title,
      ).toBe('Named anchor')
    })
    test('should enforce activated target visibility through an ordinary unversioned root', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      const staging = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 99, title: 'Hidden target' },
        req: staging,
      })
      await payload.db.create({
        collection: queryTagsSlug,
        data: { id: 1, title: 'Ordinary root', owner: 99 },
      })
      const where = { 'owner.title': { equals: 'Hidden target' } }
      expect(
        (await payload.find({ collection: queryTagsSlug, depth: 0, joins: false, where })).docs,
      ).toEqual([])
      expect(await payload.count({ collection: queryTagsSlug, where })).toEqual({ totalDocs: 0 })
      expect(
        (await payload.findDistinct({ collection: queryTagsSlug, field: 'owner.title', where }))
          .values,
      ).toEqual([])
      const selected = await payload.find({
        collection: queryTagsSlug,
        depth: 0,
        joins: false,
        where,
        req: staging,
      })
      expect(selected.docs.map((doc) => doc.id)).toEqual([1])
      expect(selected.docs[0]!.title).toBe('Ordinary root')
    })
    test('should fail closed on missing identity metadata after complete cutover', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Missing identity', _status: 'published' },
      })
      const identities =
        payload.collections[scalarArticlesSlug]!.config.custom.branchStorage.identities
      await payload.db.deleteMany({
        collection: identities,
        where: { parent: { equals: created.id } },
      })
      expect((await payload.find({ collection: scalarArticlesSlug, depth: 0 })).docs).toEqual([])
      expect(
        await payload.findByID({
          collection: scalarArticlesSlug,
          id: created.id,
          depth: 0,
          disableErrors: true,
        }),
      ).toBeNull()
      expect(await payload.count({ collection: scalarArticlesSlug })).toEqual({ totalDocs: 0 })
    })
    test('should retain virtual relationship distinct validation without replaying root hooks', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 4, title: 'Visible', _status: 'published' },
      })
      await payload.db.create({
        collection: readVirtualTagsSlug,
        data: { id: 1, title: 'Tag', owner: 4 },
      })
      const config = payload.collections[readVirtualTagsSlug]!.config
      const originalAccess = config.access.read
      const originalBefore = config.hooks.beforeOperation
      let accessCalls = 0
      let beforeCalls = 0
      config.access.read = () => {
        accessCalls++
        return true
      }
      config.hooks.beforeOperation = [
        ...originalBefore,
        ({ args }) => {
          beforeCalls++
          return args
        },
      ]
      cleanups.push(() => {
        config.access.read = originalAccess
        config.hooks.beforeOperation = originalBefore
      })
      const result = await payload.findDistinct({
        collection: readVirtualTagsSlug,
        field: 'ownerTitle',
        sort: 'title',
      })
      expect(result.values).toEqual([{ ownerTitle: 'Visible' }])
      expect(accessCalls).toBe(1)
      expect(beforeCalls).toBe(1)
    })
    test('should reject restricted distinct and sort fields before native acquisition', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 2, rank: 10, title: 'Visible', _status: 'published' },
      })
      const config = payload.collections[queryDocsSlug]!.config
      const rank = config.flattenedFields.find((field) => field.name === 'rank')!
      const previous = rank.access
      rank.access = { ...previous, read: () => false }
      cleanups.push(() => {
        rank.access = previous
      })
      await expect(
        payload.find({
          collection: queryDocsSlug,
          sort: 'rank',
          depth: 0,
          joins: false,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
      await expect(
        payload.findDistinct({ collection: queryDocsSlug, field: 'rank', overrideAccess: false }),
      ).rejects.toThrow()
    })
    test('should inherit selection and false fallback inside a pinned root access callback', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const first = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main first', _status: 'published' },
      })
      const second = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main second', _status: 'published' },
      })
      const source = await createPayloadRequest({ payload, locale: 'fr', fallbackLocale: false })
      const selected = createSelectedBranchRequest({ branchID: 'staging', req: source })
      await payload.update({
        collection: scalarArticlesSlug,
        id: second.id,
        data: { title: 'Staging second' },
        req: selected,
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.access.read
      let rootCalls = 0
      let nestedLocale: unknown
      let nestedFallback: unknown
      let nestedValue: unknown
      let captured: (() => unknown) | undefined
      config.access.read = async ({ id, req }) => {
        if (id === first.id && !req.context.nestedRead) {
          rootCalls++
          nestedFallback = req.fallbackLocale
          nestedLocale = req.locale
          const nested = await req.payload.findByID({
            collection: scalarArticlesSlug,
            id: second.id,
            depth: 0,
            req,
            context: { nestedRead: true },
          })
          nestedValue = nested.title
          captured = () => req.payload.count({ collection: scalarArticlesSlug, req })
        }
        return true
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      await payload.findByID({
        collection: scalarArticlesSlug,
        id: first.id,
        depth: 0,
        req: selected,
      })
      expect(rootCalls).toBe(1)
      expect(nestedFallback).toBe(false)
      expect(nestedLocale).toBe('fr')
      expect(nestedValue).toBe('Staging second')
      expect(source.locale).toBe('fr')
      expect(source.fallbackLocale).toBe(false)
      expect(source.transactionID).toBeUndefined()
      expect(() => captured!()).toThrow()
    })
    test('should preserve registered selection and fallback in nested field policy reads', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const first = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'First', _status: 'published' },
      })
      const second = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main related', _status: 'published' },
      })
      const source = await createPayloadRequest({ payload, locale: 'fr', fallbackLocale: false })
      const selected = createSelectedBranchRequest({ branchID: 'staging', req: source })
      await payload.update({
        collection: scalarArticlesSlug,
        id: second.id,
        data: { title: 'Selected related' },
        req: selected,
      })
      const title = payload.collections[scalarArticlesSlug]!.config.flattenedFields.find(
        (field) => field.name === 'title',
      )!
      const previous = title.access
      const values: unknown[] = []
      const locales: unknown[] = []
      const fallbacks: unknown[] = []
      title.access = {
        ...previous,
        read: async ({ req }) => {
          if (!req.context.fieldNested) {
            fallbacks.push(req.fallbackLocale)
            locales.push(req.locale)
            values.push(
              (
                await req.payload.findByID({
                  collection: scalarArticlesSlug,
                  id: second.id,
                  depth: 0,
                  req,
                  context: { fieldNested: true },
                })
              ).title,
            )
          }
          return true
        },
      }
      cleanups.push(() => {
        title.access = previous
      })
      await payload.find({
        collection: scalarArticlesSlug,
        where: { title: { equals: 'First' } },
        depth: 0,
        req: selected,
      })
      expect(fallbacks.every((value) => value === false)).toBe(true)
      expect(locales.every((value) => value === 'fr')).toBe(true)
      expect(values.length).toBeGreaterThan(0)
      expect(values.every((value) => value === 'Selected related')).toBe(true)
      expect(source.fallbackLocale).toBe(false)
      expect(source.transactionID).toBeUndefined()
    })
    test('should reject beforeOperation replacement that discards selected request registration', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main', _status: 'published' },
      })
      const selected = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.hooks.beforeOperation
      config.hooks.beforeOperation = [
        ...previous,
        ({ args }) => ({ ...args, req: { ...args.req } }),
      ]
      cleanups.push(() => {
        config.hooks.beforeOperation = previous
      })
      await expect(
        payload.findByID({
          collection: scalarArticlesSlug,
          id: created.id,
          depth: 0,
          req: selected,
        }),
      ).rejects.toThrow('registered request')
      await expect(
        payload.count({ collection: scalarArticlesSlug, req: selected }),
      ).rejects.toThrow('registered request')
    })
    test('should retain default-live draft anchor visibility', async ({ payload }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Explicit draft', _status: 'draft' },
      })
      expect(
        (await payload.findByID({ collection: scalarArticlesSlug, id: created.id, depth: 0 }))
          .title,
      ).toBe('Explicit draft')
    })
    test('should fence activation between legacy admission and native acquisition before read hooks', async ({
      payload,
    }) => {
      const config = payload.collections[scalarArticlesSlug]!.config
      const previousRead = config.access.read
      const previousAfter = config.hooks.afterRead
      let didActivate = false
      let readHooks = 0
      config.access.read = async () => {
        if (!didActivate) {
          didActivate = true
          await activateEmpty({ collection: scalarArticlesSlug, payload })
          const req = createSelectedBranchRequest({
            branchID: 'staging',
            req: await createPayloadRequest({ payload }),
          })
          await payload.create({
            collection: scalarArticlesSlug,
            data: { title: 'New hidden anchor' },
            req,
            depth: 0,
          })
        }
        return true
      }
      config.hooks.afterRead = [
        ...previousAfter,
        ({ doc, findMany }) => {
          if (findMany) {
            readHooks++
          }
          return doc
        },
      ]
      cleanups.push(() => {
        config.access.read = previousRead
        config.hooks.afterRead = previousAfter
      })
      await expect(payload.find({ collection: scalarArticlesSlug, depth: 0 })).rejects.toThrow(
        'cutover changed during legacy read',
      )
      expect(readHooks).toBe(0)
      expect((await payload.find({ collection: scalarArticlesSlug, depth: 0 })).docs).toEqual([])
    })
    test('should reject policy payload and locale rebinding before returning content', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Bound content', _status: 'published' },
      })
      const config = payload.collections[scalarArticlesSlug]!.config
      const previous = config.access.read
      cleanups.push(() => {
        config.access.read = previous
      })
      config.access.read = ({ req }) => {
        req.locale = 'fr'
        return true
      }
      await expect(
        payload.findByID({
          collection: scalarArticlesSlug,
          id: created.id,
          locale: 'en',
          depth: 0,
        }),
      ).rejects.toThrow('locale binding changed')
      config.access.read = ({ req }) => {
        req.payload = payload
        return true
      }
      await expect(
        payload.findByID({ collection: scalarArticlesSlug, id: created.id, depth: 0 }),
      ).rejects.toThrow('read-only scoped Payload')
    })
    test('should preserve selection in related validation policy nested reads', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const scalar = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main policy target', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload, locale: 'fr', fallbackLocale: false }),
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: scalar.id,
        data: { title: 'Selected policy target' },
        req,
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 4, title: 'Visible', _status: 'published' },
        locale: 'fr',
        depth: 0,
      })
      await payload.db.create({
        collection: queryTagsSlug,
        data: { id: 1, owner: 4, title: 'Tag' },
      })
      const config = payload.collections[queryDocsSlug]!.config
      const previous = config.access.read
      const values: unknown[] = []
      config.access.read = async ({ req }) => {
        expect(req.fallbackLocale).toBe(false)
        values.push(
          (
            await req.payload.findByID({
              collection: scalarArticlesSlug,
              id: scalar.id,
              depth: 0,
              req,
            })
          ).title,
        )
        return values.length === 1 ? { id: { equals: 4 } } : false
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      const result = await payload.findDistinct({
        collection: queryTagsSlug,
        field: 'owner.title',
        sort: 'title',
        req,
      })
      expect(result.values).toEqual([{ 'owner.title': 'Visible' }])
      expect(values).toHaveLength(1)
      expect(values.every((value) => value === 'Selected policy target')).toBe(true)
    })
    test('should normalize selected presence before applying public Select', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Live', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.update({
        collection: scalarArticlesSlug,
        id: created.id,
        data: { title: 'Selected' },
        req,
      })
      const doc = await payload.findByID({
        collection: scalarArticlesSlug,
        id: created.id,
        req,
        depth: 0,
        select: { title: true },
      })
      expect(doc).toEqual({ id: created.id, title: 'Selected' })
    })
    test('should preserve native untranslated status presence for locale all', async ({
      payload,
    }) => {
      const legacy = await payload.create({
        collection: localizedStatusArticlesSlug,
        data: { title: 'English', _status: 'published' },
        locale: 'en',
      })
      const legacyAll = await payload.findByID({
        collection: localizedStatusArticlesSlug,
        id: legacy.id,
        locale: 'all',
        depth: 0,
      })
      await payload.delete({ collection: localizedStatusArticlesSlug, id: legacy.id })
      await activateEmpty({ collection: localizedStatusArticlesSlug, payload })
      const created = await payload.create({
        collection: localizedStatusArticlesSlug,
        data: { title: 'English', _status: 'published' },
        locale: 'en',
      })
      const main = createBranchReadIntent({
        branchID: 'main',
        req: await createPayloadRequest({ payload }),
      })
      const effective = await payload.findByID({
        collection: localizedStatusArticlesSlug,
        id: created.id,
        locale: 'all',
        depth: 0,
        req: main,
      })
      expect(effective._status).toEqual(legacyAll._status)
      expect(effective.title).toEqual(legacyAll.title)
      const selected = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload, locale: 'fr', fallbackLocale: false }),
      })
      await payload.update({
        collection: localizedStatusArticlesSlug,
        id: created.id,
        data: { title: 'French staging' },
        req: selected,
      })
      expect(
        (
          await payload.findByID({
            collection: localizedStatusArticlesSlug,
            id: created.id,
            locale: 'fr',
            fallbackLocale: false,
            depth: 0,
            req: selected,
          })
        ).title,
      ).toBe('French staging')
      expect(
        (
          await payload.findByID({
            collection: localizedStatusArticlesSlug,
            id: created.id,
            locale: 'en',
            depth: 0,
            req: selected,
          })
        ).title,
      ).toBe('English')
    })
    test('should filter named-only children in native reverse joins', async ({ payload }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 1, title: 'Parent', _status: 'published' },
        depth: 0,
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 2, title: 'Named child', one: 1 },
        req,
        depth: 0,
      })
      const joins = {
        backlinks: { limit: 10 },
        configuredBacklinks: false,
        mixedBacklinks: false,
        typedBacklinks: false,
      } as const
      const ordinary = await payload.findByID({ collection: queryDocsSlug, id: 1, depth: 0, joins })
      expect(ordinary.backlinks?.docs).toEqual([])
      const selected = await payload.findByID({
        collection: queryDocsSlug,
        id: 1,
        depth: 0,
        joins,
        req,
      })
      expect(
        selected.backlinks?.docs.map((doc) => (typeof doc === 'object' ? doc.id : doc)),
      ).toEqual([2])
    })
    test('should not bypass authoritative membership with internal data or legacy draft fallback', async ({
      payload,
    }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const selected = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      const hidden = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Hidden' },
        req: selected,
      })
      expect(
        await payload.findByID({
          collection: scalarArticlesSlug,
          id: hidden.id,
          depth: 0,
          disableErrors: true,
          data: { id: hidden.id, title: 'Injected' },
        }),
      ).toBeNull()
      expect(
        await payload.findByID({
          collection: scalarArticlesSlug,
          id: hidden.id,
          depth: 0,
          draft: true,
          disableErrors: true,
        }),
      ).toBeNull()
    })
    test('should preserve native caller rollback and typed identity zero', async ({ payload }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 0, title: 'Main zero', _status: 'published' },
        depth: 0,
      })
      const transactionID = await payload.db.beginTransaction()
      if (transactionID == null) {
        throw new Error('A native transaction is required.')
      }
      const source = await createPayloadRequest({ payload })
      source.transactionID = transactionID
      const req = createSelectedBranchRequest({ branchID: 'staging', req: source })
      try {
        await payload.update({
          collection: queryDocsSlug,
          id: 0,
          data: { title: 'Transaction zero' },
          req,
          depth: 0,
        })
        expect(
          (
            await payload.findByID({
              collection: queryDocsSlug,
              id: 0,
              req,
              depth: 0,
              joins: false,
            })
          ).title,
        ).toBe('Transaction zero')
        expect(source.transactionID).toBe(transactionID)
      } finally {
        await payload.db.rollbackTransaction(transactionID)
      }
      const fresh = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      expect(
        (
          await payload.findByID({
            collection: queryDocsSlug,
            id: 0,
            req: fresh,
            depth: 0,
            joins: false,
          })
        ).title,
      ).toBe('Main zero')
    })
    test('should reject automatic population for relationships nested exclusively in a group', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await activateEmpty({ collection: nestedReadArticlesSlug, payload })
      const created = await payload.create({
        collection: nestedReadArticlesSlug,
        data: { title: 'Root', _status: 'published' },
        depth: 0,
      })
      await expect(
        payload.findByID({ collection: nestedReadArticlesSlug, id: created.id }),
      ).rejects.toThrow('frozen public graph integration')
    })
    test('should refuse an effective root until its encoded branchable dependencies finish cutover', async ({
      payload,
    }) => {
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 9, title: 'Legacy target', _status: 'published' },
        depth: 0,
      })
      await activateEmpty({ collection: nestedReadArticlesSlug, payload })
      const created = await payload.create({
        collection: nestedReadArticlesSlug,
        data: { title: 'Root', references: { target: 9 }, _status: 'published' },
        depth: 0,
      })
      const req = createBranchReadIntent({
        branchID: 'main',
        req: await createPayloadRequest({ payload }),
      })
      await expect(
        payload.findByID({ collection: nestedReadArticlesSlug, id: created.id, depth: 0, req }),
      ).rejects.toMatchObject({ code: 'branch-read-dependency-not-ready' })
      await expect(
        payload.find({
          collection: nestedReadArticlesSlug,
          depth: 0,
          joins: false,
          req,
          where: { 'references.target.title': { equals: 'Legacy target' } },
        }),
      ).rejects.toMatchObject({ code: 'branch-read-dependency-not-ready' })
      expect(
        (
          await payload.findByID({
            collection: nestedReadArticlesSlug,
            id: created.id,
            depth: 0,
            joins: false,
          })
        ).title,
      ).toBe('Root')
    })
    test('should keep root by-ID authorization distinct from cached self-target authorization', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 1, title: 'Parent', _status: 'published' },
        depth: 0,
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 2, title: 'Child', one: 1, _status: 'published' },
        depth: 0,
      })
      const config = payload.collections[queryDocsSlug]!.config
      const previous = config.access.read
      const calls: (number | string | undefined)[] = []
      config.access.read = ({ id }) => {
        calls.push(id)
        return { id: { equals: id === 1 ? 1 : 2 } }
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      const joins = {
        backlinks: { limit: 10 },
        configuredBacklinks: false,
        mixedBacklinks: false,
        typedBacklinks: false,
      } as const
      const result = await payload.findByID({ collection: queryDocsSlug, id: 1, depth: 0, joins })
      expect(result.id).toBe(1)
      expect(result.backlinks?.docs.map((doc) => (typeof doc === 'object' ? doc.id : doc))).toEqual(
        [2],
      )
      expect(calls).toEqual([1, undefined])
      const filtered = await payload.findByID({
        collection: queryDocsSlug,
        id: 1,
        depth: 0,
        joins: { ...joins, backlinks: { limit: 10, where: { one: { equals: 1 } } } },
      })
      expect(filtered.backlinks?.docs).toEqual([])
    })
    test('should authorize nested target predicates and sorting inside a native reverse join', async ({
      payload,
    }) => {
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.create({
        collection: queryTagsSlug,
        data: { id: 10, title: 'Visible tag' },
        depth: 0,
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 1, title: 'Parent', _status: 'published' },
        depth: 0,
      })
      await payload.create({
        collection: queryDocsSlug,
        data: { id: 2, title: 'Child', one: 1, tag: 10, _status: 'published' },
        depth: 0,
      })
      const result = await payload.findByID({
        collection: queryDocsSlug,
        id: 1,
        depth: 0,
        joins: {
          backlinks: { where: { 'tag.title': { equals: 'Visible tag' } }, sort: 'tag.title' },
          configuredBacklinks: false,
          mixedBacklinks: false,
          typedBacklinks: false,
        },
      })
      expect(result.backlinks?.docs.map((doc) => (typeof doc === 'object' ? doc.id : doc))).toEqual(
        [2],
      )
    })
    for (const draft of [false, true]) {
      test(`should fence ${draft ? 'draft fallback' : 'ordinary'} by-ID acquisition after late authority activation`, async ({
        payload,
      }) => {
        const config = payload.collections[queryDocsSlug]!.config
        const previousRead = config.access.read
        const previousAfter = config.hooks.afterRead
        let didActivate = false
        let outerHooks = 0
        config.access.read = async () => {
          if (!didActivate) {
            didActivate = true
            await activateEmpty({ collection: queryDocsSlug, payload })
            const req = createSelectedBranchRequest({
              branchID: 'staging',
              req: await createPayloadRequest({ payload }),
            })
            await payload.create({
              collection: queryDocsSlug,
              data: { id: 99, title: 'Hidden named anchor' },
              depth: 0,
              req,
            })
          }
          return true
        }
        config.hooks.afterRead = [
          ...previousAfter,
          ({ doc, req }) => {
            if (req.context.outerRead) {
              outerHooks++
            }
            return doc
          },
        ]
        cleanups.push(() => {
          config.access.read = previousRead
          config.hooks.afterRead = previousAfter
        })
        await expect(
          payload.findByID({
            collection: queryDocsSlug,
            id: 99,
            depth: 0,
            joins: false,
            draft,
            context: { outerRead: true },
          }),
        ).rejects.toThrow('cutover changed during legacy read')
        expect(outerHooks).toBe(0)
      })
    }
    test.options(
      'should keep exact Mongo identity visibility under case-insensitive collation',
      { db: 'mongo' },
      async ({ payload }) => {
        await activateEmpty({ collection: wideIDsSlug, payload })
        await payload.create({
          collection: wideIDsSlug,
          data: { id: 'identity-a', title: 'Visible', _status: 'published' },
          depth: 0,
        })
        const req = createSelectedBranchRequest({
          branchID: 'staging',
          req: await createPayloadRequest({ payload }),
        })
        await payload.create({
          collection: wideIDsSlug,
          data: { id: 'identity-A', title: 'Hidden' },
          req,
          depth: 0,
        })
        const adapter = payload.db as {
          collation?: { locale: string; strength: number }
        } & typeof payload.db
        const previous = adapter.collation
        adapter.collation = { locale: 'en', strength: 2 }
        cleanups.push(() => {
          adapter.collation = previous
        })
        const mongo = payload.db as {
          collections: Record<string, import('mongoose').Model<any>>
        } & typeof payload.db
        const model = mongo.collections[wideIDsSlug]!
        const aggregate = model.aggregate
        let pipeline: import('mongoose').PipelineStage[] = []
        model.aggregate = function (stages, options) {
          pipeline = stages ?? []
          return aggregate.call(this, stages, options)
        } as typeof aggregate
        cleanups.push(() => {
          model.aggregate = aggregate
        })
        expect(
          (await payload.find({ collection: wideIDsSlug, depth: 0, joins: false })).docs.map(
            (doc) => doc.id,
          ),
        ).toEqual(['identity-a'])
        if (process.env.PAYLOAD_BRANCH_READ_COLLATION === 'true') {
          const identities =
            mongo.collections[
              payload.collections[wideIDsSlug]!.config.custom!.branchStorage!.identities
            ]!
          const indexes = await identities.collection.indexes()
          expect(indexes.find((index) => index.name === 'parent_1')).toMatchObject({ unique: true })
          expect(indexes.find((index) => index.name === 'branch_identity_parent_en')).toMatchObject(
            { collation: { locale: 'en', strength: 2 } },
          )
          expect(
            indexes.find((index) => index.name === 'branch_identity_parent_en')?.unique,
          ).not.toBe(true)
          expect(indexes.find((index) => index.name === 'branch_identity_parent_fr')).toBeDefined()
          const explanation = await model.collection
            .aggregate(pipeline, { collation: { locale: 'en', strength: 2 } })
            .explain('executionStats')
          const lookup = explanation.stages?.find(
            (stage) => stage.$lookup?.from === identities.collection.name,
          )
          expect(lookup?.indexesUsed).toContain('branch_identity_parent_en')
        }
      },
    )
    test('should keep main read intent distinct from working writes', async ({ payload }) => {
      await activateEmpty({ collection: scalarArticlesSlug, payload })
      const created = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Main', _status: 'published' },
      })
      const source = await createPayloadRequest({ payload })
      const req = createBranchReadIntent({ branchID: 'main', req: source })
      expect(
        (await payload.findByID({ collection: scalarArticlesSlug, id: created.id, req, depth: 0 }))
          .title,
      ).toBe('Main')
      expect(() => createSelectedBranchRequest({ branchID: 'main', req: source })).toThrow(
        'publication intent',
      )
      expect(source.transactionID).toBeUndefined()
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
