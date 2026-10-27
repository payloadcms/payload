import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { migrateBranching } from '../../packages/db-mongodb/src/predefinedMigrations/migrateBranching.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { branchChangesSlug, homepageGlobalSlug, pagesSlug, uniqueSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: mongo-migration',
  { config: './config.ts', resetBetweenTests: false },
  () => {
    test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
      payload = createTrustedPayload(payloadInstance)
      restClient = restClientInstance

      const login = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: devUser.email, password: devUser.password }),
        })
        .then((res) => res.json())

      token = login.token
    })

    test.options.describe('Existing MongoDB data migration', { db: 'mongo' }, () => {
      test('should backfill main data and replace a stale unrestricted unique index', async () => {
        const adapter = payload.db as MongooseAdapter
        const page = await payload.create({
          collection: pagesSlug,
          data: { _status: 'published', title: 'legacy page' },
        })
        const unique = await payload.create({
          collection: uniqueSlug,
          data: { slug: 'legacy-unique' },
        })

        await payload.updateGlobal({
          slug: homepageGlobalSlug,
          data: { heroTitle: 'legacy global' },
        })

        await adapter.collections[pagesSlug].updateOne({ _id: page.id }, { $unset: { _branch: 1 } })
        await adapter.versions[pagesSlug].updateMany(
          { parent: page.id },
          { $unset: { _branch: 1 } },
        )
        await adapter.globals.updateOne(
          { globalType: homepageGlobalSlug },
          { $set: { _branch: null } },
        )
        await adapter.versions[homepageGlobalSlug].updateMany(
          { 'version.heroTitle': 'legacy global' },
          { $set: { _branch: null } },
        )
        await adapter.collections[uniqueSlug].collection.createIndex(
          { slug: 1 },
          { name: 'legacy_slug_unique', sparse: true, unique: true },
        )

        await expect(
          payload.create({
            branch: 'cow',
            collection: uniqueSlug,
            data: { slug: 'legacy-unique' },
          }),
        ).rejects.toThrow()

        await migrateBranching({ payload })

        const migratedPage = await adapter.collections[pagesSlug]
          .findById(page.id)
          .lean<Record<string, unknown>>()
        const migratedVersions = await adapter.versions[pagesSlug]
          .find({ parent: page.id })
          .lean<Record<string, unknown>[]>()
        const migratedGlobal = await adapter.globals
          .findOne({ globalType: homepageGlobalSlug })
          .lean<Record<string, unknown>>()
        const migratedGlobalVersions = await adapter.versions[homepageGlobalSlug]
          .find({ 'version.heroTitle': 'legacy global' })
          .lean<Record<string, unknown>[]>()

        expect(migratedPage?._branch).toBe('main')
        expect(migratedVersions.every((version) => version._branch === 'main')).toBe(true)
        expect(migratedGlobal?._branch).toBe('main')
        expect(migratedGlobalVersions.every((version) => version._branch === 'main')).toBe(true)

        const indexes = await adapter.collections[uniqueSlug].collection.indexes()

        expect(indexes.some((index) => index.name === 'legacy_slug_unique')).toBe(false)

        const onBranch = await payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { slug: 'legacy-unique' },
        })

        expect(onBranch.slug).toBe('legacy-unique')

        await payload.delete({ id: onBranch.id, branch: false, collection: uniqueSlug })
        await payload.delete({ id: unique.id, branch: false, collection: uniqueSlug })
        await payload.delete({ id: page.id, branch: false, collection: pagesSlug })

        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { collectionSlug: { equals: uniqueSlug } },
        })

        for (const change of changes.docs) {
          await payload.delete({ id: change.id, collection: branchChangesSlug })
        }
      })

      test('should report a conflict before replacing indexes', async () => {
        const adapter = payload.db as MongooseAdapter
        const existing = await payload.create({
          collection: uniqueSlug,
          data: { slug: 'migration-conflict' },
        })
        const legacy = await adapter.collections[uniqueSlug].collection.insertOne({
          slug: 'migration-conflict',
        })

        await expect(migrateBranching({ payload })).rejects.toThrow()

        const legacyAfterFailure = await adapter.collections[uniqueSlug].collection.findOne({
          _id: legacy.insertedId,
        })

        expect(legacyAfterFailure?._branch).toBeUndefined()

        await adapter.collections[uniqueSlug].collection.deleteOne({ _id: legacy.insertedId })
        await payload.delete({ id: existing.id, branch: false, collection: uniqueSlug })
      })
    })
  },
)
