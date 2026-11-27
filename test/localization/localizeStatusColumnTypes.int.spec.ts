import type { Payload } from 'payload'

import { sql } from '@payloadcms/db-postgres'
import path from 'path'
import { localizeStatus } from 'payload/migrations'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

const expectedLocalizedStatusColumnTypes = [
  {
    column_name: 'version__status',
    table_name: '_test_migration_articles_v_locales',
    udt_name: 'enum__test_migration_articles_v_version_status',
  },
  {
    column_name: '_status',
    table_name: 'test_migration_articles_locales',
    udt_name: 'enum_test_migration_articles_status',
  },
]

describe.skipIf(process.env.PAYLOAD_DATABASE !== 'postgres')(
  'localizeStatus migration column types',
  () => {
    beforeAll(async () => {
      const result = await initPayloadInt(
        dirname,
        undefined,
        undefined,
        'localizeStatusEnabled.config.ts',
      )
      payload = result.payload
    })

    afterAll(async () => {
      if (payload?.db && typeof payload.db.destroy === 'function') {
        await payload.db.destroy()
      }
    })

    // Push creates the localized schema; revert it to the shape the migration runs on.
    beforeEach(async () => {
      const db = payload.db.drizzle

      await db.execute(
        sql`ALTER TABLE _test_migration_articles_v ADD COLUMN IF NOT EXISTS version__status TEXT DEFAULT 'draft'`,
      )
      await db.execute(
        sql`ALTER TABLE _test_migration_articles_v ADD COLUMN IF NOT EXISTS snapshot BOOLEAN`,
      )
      await db.execute(
        sql`ALTER TABLE _test_migration_articles_v_locales DROP COLUMN IF EXISTS version__status`,
      )
      await db.execute(
        sql`ALTER TABLE test_migration_articles ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'draft'`,
      )
      await db.execute(
        sql`ALTER TABLE test_migration_articles_locales DROP COLUMN IF EXISTS _status`,
      )
      await db.execute(sql`DELETE FROM _test_migration_articles_v_locales`)
      await db.execute(sql`DELETE FROM _test_migration_articles_v`)
      await db.execute(sql`DELETE FROM test_migration_articles_locales`)
      await db.execute(sql`DELETE FROM test_migration_articles`)
    })

    it('should create localized status columns with the enum types the schema generator declares', async () => {
      await localizeStatus.up({
        collectionSlug: 'testMigrationArticles',
        db: payload.db.drizzle,
        payload,
        sql,
      })

      expect(await getLocalizedStatusColumnTypes()).toEqual(expectedLocalizedStatusColumnTypes)
    })

    it('should migrate with the Drizzle transaction handle a migration receives', async () => {
      await payload.db.drizzle.transaction(async (transaction) => {
        await localizeStatus.up({
          collectionSlug: 'testMigrationArticles',
          db: transaction,
          payload,
          sql,
        })
      })

      expect(await getLocalizedStatusColumnTypes()).toEqual(expectedLocalizedStatusColumnTypes)
    })
  },
)

async function getLocalizedStatusColumnTypes() {
  const result = await payload.db.drizzle.execute(sql`
    SELECT table_name, column_name, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'test_migration_articles_locales' AND column_name = '_status')
        OR (table_name = '_test_migration_articles_v_locales' AND column_name = 'version__status')
      )
    ORDER BY table_name ASC, column_name ASC
  `)

  return result.rows
}
