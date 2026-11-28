import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { GlobalSlug } from 'payload'

import assert from 'node:assert/strict'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite(
  'MongoDB global status publication',
  { config: './mongodb-global-status-api.config.ts', db: (adapter) => adapter === 'mongodb' },
  () => {
    test.afterAll(async ({ payloadInstance: payload }) => {
      const adapter = payload.db as MongooseAdapter

      assert.match(adapter.connection.db!.databaseName, /^payload_global_status_api_[a-f0-9]{32}$/)
      await adapter.connection.db!.dropDatabase()
    })

    test('should preserve localized publication and draft behavior across adapter restarts', async ({
      payload,
    }) => {
      const adapter = payload.db as MongooseAdapter

      await Promise.all(Object.values(adapter.connection.models).map((model) => model.init()))

      const indexes = await adapter.globals.collection.listIndexes().toArray()
      const previousDropDatabase = process.env.PAYLOAD_DROP_DATABASE

      expect(indexes).toHaveLength(3)

      for (const slug of ['status-alpha', 'status-beta'] as GlobalSlug[]) {
        await payload.updateGlobal({
          slug,
          data: { _status: 'published', title: `Published ${slug}` },
          locale: 'en',
          overrideAccess: true,
        })
        await payload.updateGlobal({
          slug,
          data: { _status: 'draft', title: `Draft ${slug}` },
          draft: true,
          locale: 'de',
          overrideAccess: true,
        })
      }

      process.env.PAYLOAD_DROP_DATABASE = 'false'

      try {
        for (let restart = 0; restart < 3; restart++) {
          await adapter.destroy()
          await adapter.init!()
          await adapter.connect()
          await Promise.all(Object.values(adapter.connection.models).map((model) => model.init()))

          expect(await adapter.globals.collection.listIndexes().toArray()).toEqual(indexes)

          for (const slug of ['status-alpha', 'status-beta'] as GlobalSlug[]) {
            expect(
              await payload.findGlobal({ slug, locale: 'en', overrideAccess: true }),
            ).toMatchObject({
              _status: 'published',
              title: `Published ${slug}`,
            })
            expect(
              await payload.findGlobal({ slug, draft: true, locale: 'de', overrideAccess: true }),
            ).toMatchObject({ _status: 'draft', title: `Draft ${slug}` })
          }
        }
      } finally {
        if (previousDropDatabase === undefined) {
          delete process.env.PAYLOAD_DROP_DATABASE
        } else {
          process.env.PAYLOAD_DROP_DATABASE = previousDropDatabase
        }
      }
    })
  },
)
