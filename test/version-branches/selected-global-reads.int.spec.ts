import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Model, PipelineStage } from 'mongoose'
import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

/* eslint-disable payload/no-relative-monorepo-imports -- Public global branch acquisition contracts. */
import { expect } from 'vitest'

import { buildGlobalModel } from '../../packages/db-mongodb/src/models/buildGlobalModel.js'
import { createMongoSchemaBuildContext } from '../../packages/db-mongodb/src/models/schemaBuildContext.js'
import { createBranchReadIntent } from '../../packages/payload/src/versions/branches/operations/branchReadContext.js'
import { createSelectedBranchRequest } from '../../packages/payload/src/versions/branches/operations/selectedBranchContext.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchGlobal } from '../../packages/payload/src/versions/branches/queries/queryBranchGlobal.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import {
  articlesSlug,
  caseVariantSettingsSlug,
  ordinarySettingsSlug,
  queryDocsSlug,
  settingsSlug,
} from './slugs.js'

const cleanups: (() => void)[] = []

test.suite(
  'Authoritative public global reads',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test.afterEach(() => {
      for (const cleanup of cleanups.splice(0).reverse()) {
        cleanup()
      }
    })
    test('should refuse named-only targets in an ordinary global access predicate', async ({
      payload,
    }) => {
      const config = payload.collections[articlesSlug]!.config
      await payload.db.create({
        collection: config.custom.branchStorage.cutover,
        data: {
          singleton: 'authoritative',
          schemaGeneration: 1,
          migrationID: 'b2-target-proof',
          generation: 1,
          isActivated: true,
        },
      })
      const req = await createPayloadRequest({ payload })
      req.transactionID = await payload.db.beginTransaction()
      for (const branchID of ['main', 'drafts', 'staging']) {
        await bootstrapBranchProjectionPage({
          branchID,
          collection: config.custom.branchStorage.heads,
          req,
        })
      }
      await payload.db.commitTransaction(req.transactionID!)
      delete req.transactionID
      const selected = createSelectedBranchRequest({ branchID: 'staging', req })
      const named = await payload.create({
        collection: articlesSlug,
        data: { title: 'Hidden target' },
        req: selected,
        depth: 0,
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Ordinary global', _status: 'published' },
        depth: 0,
      })
      await payload.db.updateGlobal({
        slug: settingsSlug,
        locale: 'en',
        data: { related: payload.db.name === 'mongoose' ? { en: named.id } : named.id },
      })
      const result = await payload.findGlobal({
        slug: settingsSlug,
        depth: 0,
        context: { settingsReadAccess: { 'related.title': { equals: 'Hidden target' } } },
      })
      expect(result.title).toBeUndefined()
    })
    test('should preserve distinct native, managed draft and selected global values', async ({
      payload,
    }) => {
      await activateEmpty({ global: settingsSlug, payload })
      await activateEmpty({ collection: articlesSlug, payload })
      await activateEmpty({ collection: queryDocsSlug, payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Live', _status: 'published' },
        depth: 0,
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Draft' },
        draft: true,
        depth: 0,
      })
      const source = await createPayloadRequest({ payload })
      const staging = createSelectedBranchRequest({ branchID: 'staging', req: source })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Stage' },
        req: staging,
        depth: 0,
      })
      const native = await payload.findGlobal({ slug: settingsSlug, depth: 0 })
      const draft = await payload.findGlobal({ slug: settingsSlug, depth: 0, draft: true })
      const selected = await payload.findGlobal({ slug: settingsSlug, depth: 0, req: staging })
      const main = await payload.findGlobal({
        slug: settingsSlug,
        depth: 0,
        req: createBranchReadIntent({ branchID: 'main', req: source }),
      })
      expect([native.title, draft.title, selected.title, main.title]).toEqual([
        'Live',
        'Draft',
        'Stage',
        'Live',
      ])
      for (const doc of [draft, selected, main]) {
        expect(Object.hasOwn(doc, 'id')).toBe(true)
        expect(doc.id).toBe(native.id)
        expect(doc.globalType).toBe(native.globalType)
      }
      const picked = await payload.findGlobal({
        slug: settingsSlug,
        depth: 0,
        req: staging,
        select: { title: true },
      })
      expect(picked).toEqual({ id: native.id, title: 'Stage' })
      expect(source.transactionID).toBeUndefined()
    })
    test('should query genuine localized legacy global relationships before activation', async ({
      payload,
    }) => {
      const target = await payload.create({
        collection: articlesSlug,
        data: { title: 'Legacy visible', _status: 'published' },
        depth: 0,
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'Global legacy', related: target.id, _status: 'published' },
        depth: 0,
      })
      const result = await payload.findGlobal({
        slug: settingsSlug,
        depth: 0,
        context: { settingsReadAccess: { 'related.title': { equals: 'Legacy visible' } } },
      })
      expect(result.title).toBe('Global legacy')
    })
    test('should protect versionless global target queries and retain its native body under selected targets', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const target = await payload.create({
        collection: articlesSlug,
        data: { title: 'Live target', _status: 'published' },
        depth: 0,
      })
      await payload.updateGlobal({
        slug: ordinarySettingsSlug,
        data: { title: 'Ordinary body', related: target.id },
        depth: 0,
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.update({
        collection: articlesSlug,
        id: target.id,
        data: { title: 'Selected target' },
        req,
        depth: 0,
      })
      const config = payload.globals.config.find(({ slug }) => slug === ordinarySettingsSlug)!
      const previous = config.access.read
      config.access.read = () => ({ 'related.title': { equals: 'Selected target' } })
      cleanups.push(() => {
        config.access.read = previous
      })
      expect((await payload.findGlobal({ slug: ordinarySettingsSlug, req, depth: 0 })).title).toBe(
        'Ordinary body',
      )
      expect(
        (await payload.findGlobal({ slug: ordinarySettingsSlug, depth: 0 })).title,
      ).toBeUndefined()
      config.access.read = () => ({ 'related.title': { equals: 'Live target' } })
      expect((await payload.findGlobal({ slug: ordinarySettingsSlug, depth: 0 })).title).toBe(
        'Ordinary body',
      )
    })
    for (const isAuthoritative of [false, true]) {
      test(`should preserve first draft public identity presence with authority ${isAuthoritative}`, async ({
        payload,
      }) => {
        if (isAuthoritative) {
          await activateGlobalClosure({ payload })
        }
        await payload.updateGlobal({
          slug: settingsSlug,
          draft: true,
          depth: 0,
          data: { title: 'First draft' },
        })
        const native = await payload.db.findGlobal({ slug: settingsSlug })
        const result = await payload.findGlobal({ slug: settingsSlug, depth: 0, draft: true })
        expect(result.title).toBe('First draft')
        expect(Object.hasOwn(result, 'id')).toBe(true)
        expect(result.id).toBe(native?.id)
        expect(result.globalType).toBe(native?.globalType)
      })
    }
    test('should keep independent first draft and staging global heads without exposing a live singleton', async ({
      payload,
    }) => {
      await activateGlobalClosure({ payload })
      const source = await createPayloadRequest({ payload })
      const staging = createSelectedBranchRequest({ branchID: 'staging', req: source })
      await payload.updateGlobal({
        slug: settingsSlug,
        req: staging,
        depth: 0,
        data: { title: 'Stage first' },
      })
      expect((await payload.findGlobal({ slug: settingsSlug, depth: 0 })).title).toBeUndefined()
      expect(
        (await payload.findGlobal({ slug: settingsSlug, depth: 0, draft: true })).title,
      ).toBeUndefined()
      expect((await payload.findGlobal({ slug: settingsSlug, depth: 0, req: staging })).title).toBe(
        'Stage first',
      )
      await payload.updateGlobal({
        slug: settingsSlug,
        draft: true,
        depth: 0,
        data: { title: 'Draft first' },
      })
      expect((await payload.findGlobal({ slug: settingsSlug, depth: 0, draft: true })).title).toBe(
        'Draft first',
      )
      expect((await payload.findGlobal({ slug: settingsSlug, depth: 0, req: staging })).title).toBe(
        'Stage first',
      )
      const main = createBranchReadIntent({ branchID: 'main', req: source })
      expect(
        (
          await payload.findGlobal({
            slug: settingsSlug,
            depth: 0,
            req: main,
            data: { title: 'Injected' },
          })
        ).title,
      ).toBeUndefined()
    })
    test('should preserve global locale all missing status and public Select', async ({
      payload,
    }) => {
      await activateGlobalClosure({ payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        locale: 'en',
        depth: 0,
        data: { title: 'English', _status: 'published' },
      })
      const source = await createPayloadRequest({ payload, fallbackLocale: false })
      const main = createBranchReadIntent({ branchID: 'main', req: source })
      for (const locale of ['en', 'fr', 'all'] as const) {
        const native = await payload.findGlobal({
          slug: settingsSlug,
          locale,
          depth: 0,
          fallbackLocale: false,
        })
        const effective = await payload.findGlobal({
          slug: settingsSlug,
          locale,
          depth: 0,
          fallbackLocale: false,
          req: main,
        })
        expect(Object.hasOwn(effective, 'id')).toBe(Object.hasOwn(native, 'id'))
        expect(effective.id).toBe(native.id)
        expect(effective.globalType).toBe(native.globalType)
        expect(effective.title).toEqual(native.title)
        expect(effective._status).toEqual(native._status)
      }
    })
    test('should reject detached beforeOperation global requests and mismatched slugs', async ({
      payload,
    }) => {
      await activateGlobalClosure({ payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        depth: 0,
        data: { title: 'Live', _status: 'published' },
      })
      const req = createBranchReadIntent({
        branchID: 'main',
        req: await createPayloadRequest({ payload }),
      })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.hooks.beforeOperation
      cleanups.push(() => {
        config.hooks.beforeOperation = previous
      })
      config.hooks.beforeOperation = [({ args }) => ({ ...args, req: { ...args.req } })]
      await expect(payload.findGlobal({ slug: settingsSlug, depth: 0, req })).rejects.toThrow(
        'detach',
      )
      config.hooks.beforeOperation = [({ args }) => ({ ...args, slug: ordinarySettingsSlug })]
      await expect(payload.findGlobal({ slug: settingsSlug, depth: 0, req })).rejects.toThrow(
        'genuine config',
      )
    })
    test('should keep main read intent independent from subsequent managed draft writes', async ({
      payload,
    }) => {
      await activateGlobalClosure({ payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        depth: 0,
        data: { title: 'Live', _status: 'published' },
      })
      const req = createBranchReadIntent({
        branchID: 'main',
        req: await createPayloadRequest({ payload }),
      })
      expect((await payload.findGlobal({ slug: settingsSlug, req, depth: 0 })).title).toBe('Live')
      await payload.updateGlobal({
        slug: settingsSlug,
        req,
        draft: true,
        depth: 0,
        data: { title: 'Managed next' },
      })
      expect((await payload.findGlobal({ slug: settingsSlug, depth: 0, draft: true })).title).toBe(
        'Managed next',
      )
      expect((await payload.findGlobal({ slug: settingsSlug, req, depth: 0 })).title).toBe('Live')
    })
    test('should keep withdrawn main locales unavailable while preserving independent selected content', async ({
      payload,
    }) => {
      await activateGlobalClosure({ payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        locale: 'en',
        depth: 0,
        data: { title: 'English', _status: 'published' },
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        locale: 'fr',
        depth: 0,
        data: { title: 'French', _status: 'published' },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        req,
        locale: 'en',
        depth: 0,
        data: { title: 'Selected English' },
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        locale: 'en',
        depth: 0,
        data: { _status: 'draft' },
      })
      const main = createBranchReadIntent({
        branchID: 'main',
        req: await createPayloadRequest({ payload }),
      })
      expect(
        (await payload.findGlobal({ slug: settingsSlug, req: main, locale: 'fr', depth: 0 })).title,
      ).toBe('French')
      expect(
        (await payload.findGlobal({ slug: settingsSlug, req, locale: 'en', depth: 0 })).title,
      ).toBe('Selected English')
      await payload.updateGlobal({
        slug: settingsSlug,
        depth: 0,
        unpublishAllLocales: true,
        data: { _status: 'draft' },
      })
      expect(
        (await payload.findGlobal({ slug: settingsSlug, req: main, depth: 0, locale: 'all' }))
          .title,
      ).toBeUndefined()
      expect(
        (
          await queryBranchGlobal({
            branchID: 'staging',
            global: settingsSlug,
            req: await createPayloadRequest({ payload, locale: 'en' }),
            overrideAccess: true,
          })
        )?.title,
      ).toEqual({ en: 'Selected English' })
      expect(
        (await payload.findGlobal({ slug: settingsSlug, req, locale: 'en', depth: 0 })).title,
      ).toBe('Selected English')
    })
    test('should evaluate genuine global root policy once and refuse internal data after denial', async ({
      payload,
    }) => {
      await activateGlobalClosure({ payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        depth: 0,
        data: { title: 'Live', _status: 'published' },
      })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      const calls: unknown[] = []
      config.access.read = ({ slug, req }) => {
        calls.push([slug, req.transactionID])
        return true
      }
      cleanups.push(() => {
        config.access.read = previous
      })
      expect((await payload.findGlobal({ slug: settingsSlug, depth: 0 })).title).toBe('Live')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual([settingsSlug, expect.any(String)])
      config.access.read = () => false
      expect(
        await payload.findGlobal({
          slug: settingsSlug,
          depth: 0,
          disableErrors: true,
          data: { title: 'Injected' },
        }),
      ).toBeNull()
    })
    test('should fence late global authority before empty access results or outer hooks', async ({
      payload,
    }) => {
      await payload.updateGlobal({
        slug: settingsSlug,
        depth: 0,
        data: { title: 'Legacy', _status: 'published' },
      })
      const config = payload.globals.config.find(({ slug }) => slug === settingsSlug)!
      const previous = config.access.read
      const previousAfter = config.hooks.afterRead
      let hooks = 0
      config.access.read = async () => {
        await activateGlobalClosure({ payload })
        return { title: { equals: 'Denied' } }
      }
      config.hooks.afterRead = [
        ...previousAfter,
        ({ doc }) => {
          hooks++
          return doc
        },
      ]
      cleanups.push(() => {
        config.access.read = previous
        config.hooks.afterRead = previousAfter
      })
      await expect(payload.findGlobal({ slug: settingsSlug, depth: 0 })).rejects.toThrow(
        'cutover changed during legacy read',
      )
      expect(hooks).toBe(0)
    })
    for (const isAuthoritative of [false, true]) {
      test.options(
        `should retain genuine Mongo globalType access discrimination with authority ${isAuthoritative}`,
        { db: 'mongo' },
        async ({ payload }) => {
          if (isAuthoritative) {
            await activateGlobalClosure({ payload })
          }
          await payload.updateGlobal({
            slug: settingsSlug,
            depth: 0,
            data: { title: 'Settings body', _status: 'published' },
          })
          await payload.updateGlobal({
            slug: ordinarySettingsSlug,
            depth: 0,
            data: { title: 'Other singleton body' },
          })
          expect(
            (
              await payload.findGlobal({
                slug: settingsSlug,
                depth: 0,
                context: { settingsReadAccess: { globalType: { equals: settingsSlug } } },
              })
            ).title,
          ).toBe('Settings body')
          expect(
            (
              await payload.findGlobal({
                slug: settingsSlug,
                depth: 0,
                context: { settingsReadAccess: { globalType: { equals: ordinarySettingsSlug } } },
              })
            ).title,
          ).toBeUndefined()
          if (isAuthoritative) {
            const req = createBranchReadIntent({
              branchID: 'main',
              req: await createPayloadRequest({ payload }),
            })
            expect(
              (
                await payload.findGlobal({
                  slug: settingsSlug,
                  req,
                  depth: 0,
                  context: { settingsReadAccess: { globalType: { equals: settingsSlug } } },
                })
              ).title,
            ).toBe('Settings body')
            expect(
              (
                await payload.findGlobal({
                  slug: settingsSlug,
                  req,
                  depth: 0,
                  context: { settingsReadAccess: { globalType: { equals: ordinarySettingsSlug } } },
                })
              ).title,
            ).toBeUndefined()
          }
        },
      )
    }
    for (const authority of ['legacy', 'target', 'global'] as const) {
      test.options(
        `should retain binary ordinary global root and related authorization with ${authority} authority`,
        { db: 'mongo' },
        async ({ payload }) => {
          if (authority === 'target') {
            await activateEmpty({ collection: articlesSlug, payload })
          }
          if (authority === 'global') {
            await activateGlobalClosure({ payload })
          }
          const mongo = payload.db
          const previousCollation = mongo.collation
          mongo.collation = { strength: 2 }
          cleanups.push(() => {
            mongo.collation = previousCollation
          })
          const target = await payload.create({
            collection: articlesSlug,
            data: { title: 'ExactCase', _status: 'published' },
            depth: 0,
          })
          await payload.updateGlobal({
            slug: settingsSlug,
            data: { title: 'ExactCase', related: target.id, _status: 'published' },
            depth: 0,
          })
          for (const path of ['title', 'related.title']) {
            const read = ({ value }: { value: string }) =>
              payload.findGlobal({
                slug: settingsSlug,
                locale: 'en',
                depth: 0,
                context: { settingsReadAccess: { [path]: { equals: value } } },
              })
            expect((await read({ value: 'ExactCase' })).title).toBe('ExactCase')
            expect((await read({ value: 'exactcase' })).title).toBeUndefined()
          }
        },
      )
    }
    test.options(
      'should retain configured collation for selected global projections and versionless global selected targets',
      { db: 'mongo' },
      async ({ payload }) => {
        await activateGlobalClosure({ payload })
        const mongo = payload.db
        const previousCollation = mongo.collation
        mongo.collation = { strength: 2 }
        cleanups.push(() => {
          mongo.collation = previousCollation
        })
        const req = createSelectedBranchRequest({
          branchID: 'staging',
          req: await createPayloadRequest({ payload }),
        })
        const target = await payload.create({
          collection: articlesSlug,
          req,
          data: { title: 'SelectedCase' },
          depth: 0,
        })
        await payload.updateGlobal({
          slug: settingsSlug,
          req,
          data: { title: 'SelectedCase', related: target.id },
          depth: 0,
        })
        expect(
          (
            await payload.findGlobal({
              slug: settingsSlug,
              req,
              depth: 0,
              context: { settingsReadAccess: { title: { equals: 'selectedcase' } } },
            })
          ).title,
        ).toBe('SelectedCase')
        expect(
          (
            await payload.find({
              collection: articlesSlug,
              req,
              depth: 0,
              where: { title: { equals: 'selectedcase' } },
            })
          ).docs.map(({ id }) => id),
        ).toEqual([target.id])
        await payload.updateGlobal({
          slug: ordinarySettingsSlug,
          data: { title: 'NativeCase', related: target.id },
          depth: 0,
        })
        expect(
          (await payload.findGlobal({ slug: ordinarySettingsSlug, req, depth: 0 })).title,
        ).toBe('NativeCase')
        const config = payload.globals.config.find(({ slug }) => slug === ordinarySettingsSlug)!
        const previousRead = config.access.read
        config.access.read = () => ({ 'related.title': { equals: 'SelectedCase' } })
        cleanups.push(() => {
          config.access.read = previousRead
        })
        expect(
          (await payload.findGlobal({ slug: ordinarySettingsSlug, req, depth: 0 })).title,
        ).toBe('NativeCase')
        config.access.read = () => ({ 'related.title': { equals: 'selectedcase' } })
        expect(
          (await payload.findGlobal({ slug: ordinarySettingsSlug, req, depth: 0 })).title,
        ).toBeUndefined()
      },
    )
    test.options(
      'should create only canonical native sphere indexes for a genuine ten-locale global schema',
      { db: 'mongo' },
      async ({ payload }) => {
        const mongo = payload.db as MongooseAdapter
        const databaseName = `${mongo.connection.name}_b2_ten_locales`
        const connection = mongo.connection.useDb(databaseName, { useCache: false })
        const localeCodes = ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'sv', 'pl', 'fi']
        const slug = 'b2-ten-locale-settings'
        try {
          const adapter = {
            ...mongo,
            connection,
            collation: { strength: 2 },
            payload: {
              ...payload,
              config: {
                ...payload.config,
                globals: [
                  {
                    slug,
                    fields: [{ name: 'location', type: 'point', localized: true }],
                    flattenedFields: [{ name: 'location', type: 'point', localized: true }],
                  },
                ],
                localization: {
                  defaultLocale: 'en',
                  fallback: false,
                  localeCodes,
                  locales: localeCodes.map((code) => ({ code, label: code })),
                },
              },
            },
          } as unknown as MongooseAdapter
          const model = buildGlobalModel({
            adapter,
            schemaBuildContext: createMongoSchemaBuildContext({ connection }),
          })!
          adapter.globals = model
          const discriminator = model.discriminators![slug]!
          expect(discriminator.schema.indexes()).toHaveLength(10)
          await discriminator.createIndexes()
          const indexes = await model.collection.indexes()
          expect(indexes).toHaveLength(11)
          expect(indexes.every((index) => !index.collation)).toBe(true)
          const inserted = await model.collection.insertOne({
            globalType: slug,
            location: { en: { type: 'Point', coordinates: [0, 0] } },
          })
          const native = await mongo.findGlobal.call(adapter, {
            slug,
            locale: 'en',
            where: { location: { near: [0, 0, 1000] } },
          })
          expect(native?.id).toBe(String(inserted.insertedId))
          const pipeline: PipelineStage[] = [
            {
              $geoNear: {
                key: 'location.en',
                near: { type: 'Point', coordinates: [0, 0] },
                distanceField: 'distance',
                spherical: true,
                query: { globalType: slug },
              },
            },
          ]
          const docs = await model.aggregate(pipeline)
          expect(docs.map(({ _id }) => String(_id))).toEqual([String(inserted.insertedId)])
          const plan = JSON.stringify(await model.aggregate(pipeline).explain('queryPlanner'))
          expect(plan).toContain('GEO_NEAR_2DSPHERE')
          expect(plan).toContain('location.en_2dsphere')
        } finally {
          await connection.dropDatabase()
          await mongo.connection.removeDb(databaseName)
        }
      },
    )
    test.options(
      'should keep native global near first and discriminate the shared Mongo singleton model before limiting',
      { db: 'mongo' },
      async ({ payload }) => {
        await payload.updateGlobal({
          slug: settingsSlug,
          depth: 0,
          data: { title: 'Other singleton', _status: 'published' },
        })
        await payload.updateGlobal({
          slug: ordinarySettingsSlug,
          depth: 0,
          data: { title: 'Geo singleton', location: [0, 0] },
        })
        const config = payload.globals.config.find(({ slug }) => slug === ordinarySettingsSlug)!
        const previousRead = config.access.read
        config.access.read = () => ({ location: { near: [0, 0, 1000] } })
        const mongo = payload.db as { globals: Model } & typeof payload.db
        const aggregate = mongo.globals.aggregate
        cleanups.push(() => {
          config.access.read = previousRead
          mongo.globals.aggregate = aggregate
        })
        const discriminatorModel = mongo.globals.discriminators![ordinarySettingsSlug]!

        await discriminatorModel.createIndexes()
        expect((await payload.findGlobal({ slug: ordinarySettingsSlug, depth: 0 })).title).toBe(
          'Geo singleton',
        )
        await activateEmpty({ collection: articlesSlug, payload })
        let pipeline: PipelineStage[] = []
        mongo.globals.aggregate = function (stages, options) {
          pipeline = stages ?? []
          return aggregate.call(this, stages, options)
        } as typeof aggregate

        expect((await payload.findGlobal({ slug: ordinarySettingsSlug, depth: 0 })).title).toBe(
          'Geo singleton',
        )
        expect(pipeline[0]).toHaveProperty('$geoNear')
        const discriminator = pipeline.findIndex(
          (stage) => '$match' in stage && stage.$match.globalType === ordinarySettingsSlug,
        )
        const limit = pipeline.findIndex((stage) => '$limit' in stage)
        expect(discriminator).toBeGreaterThan(0)
        expect(discriminator).toBeLessThan(limit)
        const explanation = await mongo.globals.aggregate(pipeline).explain('queryPlanner')
        const plan = JSON.stringify(explanation)
        expect(plan).toContain('GEO_NEAR_2DSPHERE')
        const indexes = await mongo.globals.collection.indexes()
        const geoIndexes = indexes.filter((index) => index.key.location === '2dsphere')
        expect(geoIndexes.some((index) => plan.includes(`"indexName":"${index.name}"`))).toBe(true)
        expect(geoIndexes.some((index) => !index.collation)).toBe(true)
        expect(geoIndexes).toHaveLength(1)
        expect(geoIndexes[0]!.collation).toBeUndefined()
      },
    )
    test.options(
      'should characterize the legacy SQL globalType policy boundary',
      { db: 'drizzle' },
      async ({ payload }) => {
        await payload.updateGlobal({
          slug: settingsSlug,
          depth: 0,
          data: { title: 'Legacy SQL body', _status: 'published' },
        })
        await expect(
          payload.findGlobal({
            slug: settingsSlug,
            depth: 0,
            context: { settingsReadAccess: { globalType: { equals: settingsSlug } } },
          }),
        ).rejects.toThrow('globalType')
      },
    )
    for (const isAuthoritative of [false, true]) {
      test(`should authorize public global native identity operands with authority ${isAuthoritative}`, async ({
        payload,
      }) => {
        if (isAuthoritative) {
          await activateGlobalClosure({ payload })
        }
        await payload.updateGlobal({
          slug: settingsSlug,
          depth: 0,
          data: { title: 'Identity live', _status: 'published' },
        })
        await payload.updateGlobal({
          slug: settingsSlug,
          depth: 0,
          draft: true,
          data: { title: 'Identity draft' },
        })
        const native = await payload.db.findGlobal({ slug: settingsSlug })
        expect(native?.id).toBeDefined()
        for (const draft of isAuthoritative ? [false, true] : [false]) {
          const positive = await payload.findGlobal({
            slug: settingsSlug,
            depth: 0,
            draft,
            context: { settingsReadAccess: { id: { equals: native!.id } } },
          })
          const negative = await payload.findGlobal({
            slug: settingsSlug,
            depth: 0,
            draft,
            context: { settingsReadAccess: { id: { not_equals: native!.id } } },
          })

          expect(positive.id).toBe(native!.id)
          expect(negative.title).toBeUndefined()
          expect(positive.title).toBe(draft ? 'Identity draft' : 'Identity live')
        }
        const mainTitles: unknown[] = []
        if (isAuthoritative) {
          const req = createBranchReadIntent({
            branchID: 'main',
            req: await createPayloadRequest({ payload }),
          })
          mainTitles.push(
            (
              await payload.findGlobal({
                slug: settingsSlug,
                req,
                depth: 0,
                context: { settingsReadAccess: { id: { equals: native!.id } } },
              })
            ).title,
          )
          mainTitles.push(
            (
              await payload.findGlobal({
                slug: settingsSlug,
                req,
                depth: 0,
                context: { settingsReadAccess: { id: { not_equals: native!.id } } },
              })
            ).title,
          )
        }
        expect(mainTitles).toEqual(isAuthoritative ? ['Identity live', undefined] : [])
      })
    }
    for (const isAuthoritative of [false, true]) {
      test.options(
        `should keep distinct genuine global identities under case-insensitive Mongo collation with authority ${isAuthoritative}`,
        { db: 'mongo' },
        async ({ payload }) => {
          if (isAuthoritative) {
            await activateGlobalClosure({ payload })
          }
          const mongo = payload.db as {
            collation?: { locale?: string; strength?: number }
            globals: Model
          } & typeof payload.db
          const previous = mongo.collation
          mongo.collation = { locale: 'en', strength: 2 }
          cleanups.push(() => {
            mongo.collation = previous
          })
          expect(
            payload.globals.config.find(({ slug }) => slug === caseVariantSettingsSlug)?.slug,
          ).toBe(caseVariantSettingsSlug)
          await payload.updateGlobal({
            slug: caseVariantSettingsSlug,
            depth: 0,
            data: { title: 'Other case singleton', caseLocation: [0, 0] },
          })
          await payload.updateGlobal({
            slug: settingsSlug,
            depth: 0,
            data: { title: 'Correct singleton', _status: 'published' },
          })
          const other = await payload.findGlobal({ slug: caseVariantSettingsSlug, depth: 0 })
          const own = await payload.findGlobal({ slug: settingsSlug, depth: 0 })
          expect(other.id).toBeDefined()
          expect(own.id).toBeDefined()
          expect(other.id).not.toBe(own.id)
          expect((await payload.findGlobal({ slug: settingsSlug, depth: 0 })).title).toBe(
            'Correct singleton',
          )
          if (!isAuthoritative) {
            await activateEmpty({ collection: articlesSlug, payload })
          }
          const result = await payload.findGlobal({ slug: settingsSlug, depth: 0 })

          expect(result.title).toBe('Correct singleton')
          expect(result.id).toBe(own.id)
          expect(result.globalType).toBe(settingsSlug)
          if (isAuthoritative) {
            const req = createBranchReadIntent({
              branchID: 'main',
              req: await createPayloadRequest({ payload }),
            })
            const effective = await payload.findGlobal({ slug: settingsSlug, req, depth: 0 })
            expect(effective.title).toBe('Correct singleton')
            expect(effective.id).toBe(own.id)
            expect(effective.globalType).toBe(settingsSlug)
          }
        },
      )
    }
    test('should characterize genuine legacy global public shapes', async ({ payload }) => {
      const empty = await payload.findGlobal({ slug: settingsSlug, depth: 0, locale: 'all' })
      await payload.updateGlobal({
        slug: settingsSlug,
        locale: 'en',
        data: { title: 'Live', _status: 'published' },
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        locale: 'fr',
        draft: true,
        data: { title: 'French draft' },
      })
      const values = []
      for (const draft of [false, true]) {
        for (const locale of ['en', 'fr', 'all'] as const) {
          const doc = await payload.findGlobal({
            slug: settingsSlug,
            depth: 0,
            draft,
            locale,
            fallbackLocale: false,
          })
          values.push({ draft, locale, ownID: Object.hasOwn(doc, 'id'), doc })
        }
      }

      expect(empty).toEqual({ _status: 'draft' })
      expect(values).toHaveLength(6)
      for (const { doc, ownID } of values) {
        expect(ownID).toBe(true)
        expect(doc.id).toBeDefined()
        expect(doc.id).toBe(values[0]!.doc.id)
        expect(Object.hasOwn(doc, 'globalType')).toBe(true)
        expect(doc.globalType).toBe(settingsSlug)
        expect(doc.createdAt).toEqual(expect.any(String))
        expect(doc.updatedAt).toEqual(expect.any(String))
      }
      expect(values.map(({ doc }) => doc.title)).toEqual([
        'Live',
        undefined,
        { en: 'Live' },
        'Live',
        'French draft',
        { en: 'Live', fr: 'French draft' },
      ])
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
      migrationID: 'b2-empty',
      generation: 1,
      isActivated: true,
    },
  })
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()
  if (transactionID == null) {
    throw new Error('Native transaction required')
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

const activateGlobalClosure = async ({ payload }: { payload: Payload }) => {
  await activateEmpty({ collection: articlesSlug, payload })
  await activateEmpty({ collection: queryDocsSlug, payload })
  await activateEmpty({ global: settingsSlug, payload })
}
