import type { Payload } from 'payload'

import { localizeStatus } from '@payloadcms/db-mongodb/migration-utils'
import { sql } from '@payloadcms/db-postgres'
import { migratePostgresLocalizeStatus } from '@payloadcms/db-postgres/migration-utils'
import { migrateSqliteLocalizeStatus } from '@payloadcms/db-sqlite/migration-utils'
import { sql as drizzleSql } from 'drizzle-orm'
import { Types } from 'mongoose'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('localizeStatus migration', () => {
  beforeAll(async () => {
    const result = await initPayloadInt(dirname, undefined, undefined, 'localizeStatus.config.ts')
    payload = result.payload

    if (process.env.PAYLOAD_DATABASE === 'mongodb' || !process.env.PAYLOAD_DATABASE) {
      // Wait for MongoDB to finish building indexes to avoid
      // "Unable to write to collection due to catalog changes" errors
      await wait(1000)
    }
  })
  afterAll(async () => {
    if (payload?.db && typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe.skipIf(process.env.PAYLOAD_DATABASE !== 'postgres')('PostgreSQL', () => {
    // Reset both test collections to their pre-migration database shape before every
    // scenario so each test is self-contained and order-independent. Real users' databases
    // will be in this pre-migration state; the runtime schema (localizeStatus auto-inferred)
    // is reverted here via raw SQL. Each scenario's migration mutates the schema, so this
    // must run before every test rather than once.
    beforeEach(async () => {
      const db = payload.db

      // testMigrationPosts: title is NOT localized, so versions have no locales table.
      // Pre-migration: version__status (+ snapshot) on the versions table, _status on main.
      await db.drizzle.execute(sql`DROP TABLE IF EXISTS _test_migration_posts_v_locales`)
      await db.drizzle.execute(
        sql`ALTER TABLE _test_migration_posts_v ADD COLUMN IF NOT EXISTS version__status TEXT DEFAULT 'draft'`,
      )
      await db.drizzle.execute(
        sql`ALTER TABLE _test_migration_posts_v ADD COLUMN IF NOT EXISTS snapshot BOOLEAN`,
      )
      await db.drizzle.execute(
        sql`ALTER TABLE test_migration_posts ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'draft'`,
      )
      await db.drizzle.execute(sql`DELETE FROM _test_migration_posts_v`)
      await db.drizzle.execute(sql`DELETE FROM test_migration_posts`)

      // testMigrationArticles: title IS localized, so locales tables exist.
      // Pre-migration: version__status (+ snapshot) on the versions table and _status on main,
      // with NO version__status/_status in the locales tables yet.
      await db.drizzle.execute(
        sql`ALTER TABLE _test_migration_articles_v ADD COLUMN IF NOT EXISTS version__status TEXT DEFAULT 'draft'`,
      )
      await db.drizzle.execute(
        sql`ALTER TABLE _test_migration_articles_v ADD COLUMN IF NOT EXISTS snapshot BOOLEAN`,
      )
      await db.drizzle.execute(
        sql`ALTER TABLE _test_migration_articles_v_locales DROP COLUMN IF EXISTS version__status`,
      )
      await db.drizzle.execute(
        sql`ALTER TABLE test_migration_articles ADD COLUMN IF NOT EXISTS _status TEXT DEFAULT 'draft'`,
      )
      await db.drizzle.execute(
        sql`ALTER TABLE test_migration_articles_locales DROP COLUMN IF EXISTS _status`,
      )
      await db.drizzle.execute(sql`DELETE FROM _test_migration_articles_v_locales`)
      await db.drizzle.execute(sql`DELETE FROM _test_migration_articles_v`)
      await db.drizzle.execute(sql`DELETE FROM test_migration_articles_locales`)
      await db.drizzle.execute(sql`DELETE FROM test_migration_articles`)
    })

    describe('Scenario 1: Creating new locales table', () => {
      it('should migrate non-localized _status to localized', async () => {
        const db = payload.db

        // At this point, Payload has created:
        // - test_migration_posts table
        // - _test_migration_posts_v table (versions) with _status column (because drafts: true)
        // But NO _test_migration_posts_v_locales table (no localized fields in versions)

        // Step 1: Create some test data
        const post1 = await payload.create({
          collection: 'testMigrationPosts',
          data: { title: 'Post 1' },
        })

        // Publish the post
        await payload.update({
          id: post1.id,
          collection: 'testMigrationPosts',
          data: { _status: 'published', title: 'Post 1 Updated' },
        })

        // Step 2: Verify "before" state
        const beforeVersions = await db.drizzle.execute(sql`
        SELECT id, parent_id as parent, version__status as _status
        FROM _test_migration_posts_v
        WHERE parent_id = ${post1.id}
      `)

        expect(beforeVersions.rows.length).toBeGreaterThan(0)
        // Verify version records exist
        const latestVersion = beforeVersions.rows[beforeVersions.rows.length - 1]
        expect(latestVersion).toBeDefined()

        // Step 3: Run the migration
        await migratePostgresLocalizeStatus({
          collectionSlug: 'testMigrationPosts',
          db,
          payload,
          sql,
        })

        // Step 4: Verify "after" state
        // Check that locales table was created
        const tableCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_posts_v_locales'
        ) as exists
      `)

        expect(tableCheck.rows[0].exists).toBe(true)

        // Check that _status column was dropped from main table
        const columnCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_posts_v'
          AND column_name = 'version__status'
        ) as exists
      `)

        expect(columnCheck.rows[0].exists).toBe(false)

        // Check that _status data was migrated to locales table
        const localesData = await db.drizzle.execute(sql`
        SELECT _locale, _parent_id, version__status as _status
        FROM _test_migration_posts_v_locales
        ORDER BY _parent_id, _locale
      `)

        // Should have 3 locales * number of versions
        expect(localesData.rows).toHaveLength(beforeVersions.rows.length * 3) // 3 locales

        // All locales should have the same status (copied from original)
        const enRows = localesData.rows.filter((row) => row._locale === 'en')
        const esRows = localesData.rows.filter((row) => row._locale === 'es')
        const deRows = localesData.rows.filter((row) => row._locale === 'de')

        expect(enRows.length).toBeGreaterThan(0)
        expect(esRows).toHaveLength(enRows.length)
        expect(deRows).toHaveLength(enRows.length)

        // Verify all locales have the same status (copied from original version__status)
        enRows.forEach((enRow, idx) => {
          const esRow = esRows[idx]!
          const deRow = deRows[idx]!
          expect(enRow._status).toBe(esRow._status)
          expect(enRow._status).toBe(deRow._status)
        })
      })
    })

    describe('Scenario 2: Adding to existing locales table', () => {
      it('should add _status column to existing locales table', async () => {
        const db = payload.db

        // Schema is in pre-migration state (set up in the beforeEach hook):
        // - _test_migration_articles_v has version__status in main table
        // - _test_migration_articles_v_locales has version_title but NOT version__status
        //
        // We use raw SQL because the Payload runtime has localizeStatus auto-inferred as true,
        // so using the Payload API would try to write to a schema that's been reverted.

        // Step 1: Create test data via raw SQL
        const articleResult = await db.drizzle.execute(sql`
          INSERT INTO test_migration_articles (_status, created_at, updated_at)
          VALUES ('draft', NOW(), NOW())
          RETURNING id
        `)
        const articleId = articleResult.rows[0].id

        await db.drizzle.execute(sql`
          INSERT INTO test_migration_articles_locales (_locale, _parent_id, title)
          VALUES
            ('en', ${articleId}, 'English Title'),
            ('es', ${articleId}, 'Título Español'),
            ('de', ${articleId}, 'German Title')
        `)

        const draftVersionResult = await db.drizzle.execute(sql`
          INSERT INTO _test_migration_articles_v (parent_id, version__status, created_at, updated_at)
          VALUES (${articleId}, 'draft', NOW(), NOW())
          RETURNING id
        `)
        const draftVersionId = draftVersionResult.rows[0].id

        for (const locale of ['en', 'es', 'de']) {
          await db.drizzle.execute(sql`
            INSERT INTO _test_migration_articles_v_locales (_locale, _parent_id)
            VALUES (${locale}, ${draftVersionId})
          `)
        }

        const publishedVersionResult = await db.drizzle.execute(sql`
          INSERT INTO _test_migration_articles_v (parent_id, version__status, created_at, updated_at)
          VALUES (${articleId}, 'published', NOW() + INTERVAL '1 second', NOW() + INTERVAL '1 second')
          RETURNING id
        `)
        const publishedVersionId = publishedVersionResult.rows[0].id

        for (const locale of ['en', 'es', 'de']) {
          await db.drizzle.execute(sql`
            INSERT INTO _test_migration_articles_v_locales (_locale, _parent_id)
            VALUES (${locale}, ${publishedVersionId})
          `)
        }

        // Step 2: Run the migration
        await migratePostgresLocalizeStatus({
          collectionSlug: 'testMigrationArticles',
          db,
          payload,
          sql,
        })

        // Step 3: Verify that version__status column was added to locales table
        const columnCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_articles_v_locales'
          AND column_name = 'version__status'
        ) as exists
      `)

        expect(columnCheck.rows[0].exists).toBe(true)

        // Step 4: Verify migration completed successfully
        const localesData = await db.drizzle.execute(sql`
        SELECT l._locale, l.version__status as _status
        FROM _test_migration_articles_v_locales l
        JOIN _test_migration_articles_v v ON l._parent_id = v.id
        WHERE v.parent_id = ${articleId}
        ORDER BY v.created_at DESC, l._locale
      `)

        // Verify that _status column exists and has data for each locale
        expect(localesData.rows.length).toBeGreaterThan(0)
        const enRows = localesData.rows.filter((row) => row._locale === 'en')
        const esRows = localesData.rows.filter((row) => row._locale === 'es')

        expect(enRows.length).toBeGreaterThan(0)
        expect(esRows.length).toBeGreaterThan(0)

        // Verify each row has a status value
        enRows.forEach((row) => {
          expect(row._status).toBeDefined()
          expect(['draft', 'published']).toContain(row._status)
        })

        esRows.forEach((row) => {
          expect(row._status).toBeDefined()
          expect(['draft', 'published']).toContain(row._status)
        })
      })
    })

    describe('Scenario 3: Demonstrate version history migration', () => {
      it('should show how version rows are transformed', async () => {
        const db = payload.db

        // Create a complex version history
        const post = await payload.create({
          collection: 'testMigrationPosts',
          data: { title: 'Initial Draft' },
        })

        // Publish it
        await payload.update({
          id: post.id,
          collection: 'testMigrationPosts',
          data: { _status: 'published', title: 'Published Version' },
        })

        // Make a draft change
        await payload.update({
          id: post.id,
          collection: 'testMigrationPosts',
          data: { _status: 'draft', title: 'Draft Changes' },
        })

        // Publish again
        await payload.update({
          id: post.id,
          collection: 'testMigrationPosts',
          data: { _status: 'published', title: 'Re-published' },
        })

        // Query BEFORE migration
        const beforeVersions = await db.drizzle.execute(sql`
        SELECT
          id,
          parent_id as parent,
          version__status as _status,
          created_at,
          snapshot
        FROM _test_migration_posts_v
        WHERE parent_id = ${post.id}
        ORDER BY created_at ASC
      `)

        console.log('\n========== BEFORE MIGRATION ==========')
        console.log('Version rows (OLD system with single _status column):')
        beforeVersions.rows.forEach((row, idx) => {
          console.log(
            `V${idx + 1}: id=${row.id}, _status=${row._status}, snapshot=${row.snapshot || false}`,
          )
        })

        // Run migration
        await migratePostgresLocalizeStatus({
          collectionSlug: 'testMigrationPosts',
          db,
          payload,
          sql,
        })

        // Query AFTER migration
        const afterLocales = await db.drizzle.execute(sql`
        SELECT
          v.id as version_id,
          v.created_at,
          l._locale,
          l.version__status as _status
        FROM _test_migration_posts_v v
        JOIN _test_migration_posts_v_locales l ON l._parent_id = v.id
        WHERE v.parent_id = ${post.id}
        ORDER BY v.created_at ASC, l._locale ASC
      `)

        console.log('\n========== AFTER MIGRATION ==========')
        console.log('Version rows (NEW system with per-locale _status):')

        let currentVersionId: any = null
        let versionIndex = 0

        afterLocales.rows.forEach((row) => {
          if (row.version_id !== currentVersionId) {
            currentVersionId = row.version_id
            versionIndex++
            console.log(`\nV${versionIndex}: version_id=${row.version_id}`)
          }
          console.log(`  ${row._locale}: ${row._status}`)
        })
        console.log('\n======================================\n')

        // Verify the migration logic
        expect(beforeVersions.rows.length).toBeGreaterThan(0)
        expect(afterLocales.rows).toHaveLength(beforeVersions.rows.length * 3) // 3 locales
      })
    })

    describe('Scenario 4: Test publishedLocale handling', () => {
      it('should handle publishedLocale correctly', async () => {
        const db = payload.db

        // Use testMigrationArticles which has localized fields and thus an existing locales table
        // This will trigger the intelligent migration path with publishedLocale handling
        await db.drizzle.execute(sql`DELETE FROM _test_migration_articles_v`)
        await db.drizzle.execute(sql`DELETE FROM _test_migration_articles_v_locales`)

        // Create a parent article document via raw SQL.
        // The articles schema is in post-migration state for the runtime, so we set up the
        // pre-migration shape we need directly via SQL rather than through the Payload API.
        const articleResult = await db.drizzle.execute(sql`
          INSERT INTO test_migration_articles (_status, created_at, updated_at)
          VALUES ('draft', NOW(), NOW())
          RETURNING id
        `)

        const parentId = articleResult.rows[0].id

        // Helper to insert version with locales rows
        const insertVersion = async (
          status: 'draft' | 'published',
          publishedLocale: null | string,
          intervalSeconds: number,
        ) => {
          const result = await db.drizzle.execute(sql`
          INSERT INTO _test_migration_articles_v (parent_id, version__status, published_locale, created_at, updated_at)
          VALUES (
            ${parentId},
            ${status},
            ${publishedLocale},
            NOW() + INTERVAL '${sql.raw(intervalSeconds.toString())} seconds',
            NOW() + INTERVAL '${sql.raw(intervalSeconds.toString())} seconds'
          )
          RETURNING id
        `)
          const versionId = result.rows[0]?.id
          if (!versionId) {
            throw new Error('Failed to insert version')
          }

          // Create locales rows for this version (without _status, that will be added by migration)
          for (const locale of ['en', 'es', 'de']) {
            await db.drizzle.execute(sql`
            INSERT INTO _test_migration_articles_v_locales (_locale, _parent_id)
            VALUES (${locale}, ${versionId})
          `)
          }
        }

        // V1: Initial draft
        await insertVersion('draft', null, 0)

        // V2: Publish all locales (no publishedLocale)
        await insertVersion('published', null, 1)

        // V3: Publish only 'en' locale
        await insertVersion('published', 'en', 2)

        // V4: Draft save (unpublish all)
        await insertVersion('draft', null, 3)

        // V5: Publish only 'es' locale
        await insertVersion('published', 'es', 4)

        // V6: Publish only 'de' locale
        await insertVersion('published', 'de', 5)

        // Query BEFORE migration
        const beforeVersions = await db.drizzle.execute(sql`
        SELECT
          id,
          version__status as _status,
          published_locale
        FROM _test_migration_articles_v
        WHERE parent_id = ${parentId}
        ORDER BY created_at ASC
      `)

        console.log('\n========== BEFORE MIGRATION (with publishedLocale) ==========')
        beforeVersions.rows.forEach((row, idx) => {
          console.log(
            `V${idx + 1}: _status=${row._status}, publishedLocale=${row.published_locale || 'null'}`,
          )
        })

        // Run migration
        await migratePostgresLocalizeStatus({
          collectionSlug: 'testMigrationArticles',
          db,
          payload,
          sql,
        })

        // Query AFTER migration
        const afterLocales = await db.drizzle.execute(sql`
        SELECT
          v.id as version_id,
          l._locale,
          l.version__status as _status
        FROM _test_migration_articles_v v
        JOIN _test_migration_articles_v_locales l ON l._parent_id = v.id
        WHERE v.parent_id = ${parentId}
        ORDER BY v.created_at ASC, l._locale ASC
      `)

        console.log('\n========== AFTER MIGRATION (with publishedLocale) ==========')

        let currentVersionId: any = null
        let versionIndex = 0

        afterLocales.rows.forEach((row) => {
          if (row.version_id !== currentVersionId) {
            currentVersionId = row.version_id
            versionIndex++
            console.log(`\nV${versionIndex}:`)
          }
          console.log(`  ${row._locale}: ${row._status}`)
        })
        console.log('\n======================================\n')

        // Verify the expected results
        const versionGroups = afterLocales.rows.reduce(
          (acc, row) => {
            if (!acc[row.version_id]) {
              acc[row.version_id] = []
            }
            acc[row.version_id].push(row)
            return acc
          },
          {} as Record<string, any[]>,
        )

        const versions = Object.values(versionGroups)

        // V1: Initial draft → all draft
        expect(versions[0].every((row) => row._status === 'draft')).toBe(true)

        // V2: Publish all (no publishedLocale) → all published
        expect(versions[1].every((row) => row._status === 'published')).toBe(true)

        // V3: Publish only 'en' → en=published, others stay published
        const v3 = versions[2]
        expect(v3.find((r) => r._locale === 'en')._status).toBe('published')
        expect(v3.find((r) => r._locale === 'es')._status).toBe('published')
        expect(v3.find((r) => r._locale === 'de')._status).toBe('published')

        // V4: Draft save → all draft
        expect(versions[3].every((row) => row._status === 'draft')).toBe(true)

        // V5: Publish only 'es' → es=published, others stay draft
        const v5 = versions[4]
        expect(v5.find((r) => r._locale === 'en')._status).toBe('draft')
        expect(v5.find((r) => r._locale === 'es')._status).toBe('published')
        expect(v5.find((r) => r._locale === 'de')._status).toBe('draft')

        // V6: Publish only 'de' → de=published, en=draft, es=published
        const v6 = versions[5]
        expect(v6.find((r) => r._locale === 'en')._status).toBe('draft')
        expect(v6.find((r) => r._locale === 'es')._status).toBe('published')
        expect(v6.find((r) => r._locale === 'de')._status).toBe('published')
      })
    })

    describe('Scenario 5: Skip collections without versions', () => {
      it('should skip migration for collections without versions enabled', async () => {
        // Create a document in the collection without versions
        const doc = await payload.create({
          collection: 'testNoVersions',
          data: { title: 'Test document' },
        })

        expect(doc.id).toBeDefined()

        // Attempt to run the migration - it should return early without error
        await expect(
          migratePostgresLocalizeStatus({
            collectionSlug: 'testNoVersions',
            db: payload.db,
            payload,
            sql,
          }),
        ).resolves.not.toThrow()

        // Verify that no versions table was created (since versions weren't enabled)
        const tableExists = await payload.db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '_test_no_versions_v'
        ) as exists
      `)

        expect(tableExists.rows[0].exists).toBe(false)
      })
    })
  })

  describe.skipIf(process.env.PAYLOAD_DATABASE !== 'sqlite')('SQLite', () => {
    // Mirror the PostgreSQL suite: revert the runtime (post-migration) schema back to its
    // pre-migration shape before every scenario so each test is self-contained. SQLite has no
    // `ADD COLUMN IF NOT EXISTS` / `DROP COLUMN IF EXISTS`, so we guard with pragma_table_info.
    const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
      const rows = (await payload.db.drizzle.all(
        drizzleSql.raw(
          `SELECT COUNT(*) as count FROM pragma_table_info('${tableName}') WHERE name = '${columnName}'`,
        ),
      )) as any[]
      return Number(rows[0]?.count ?? 0) > 0
    }

    const addColumnIfMissing = async (
      tableName: string,
      columnName: string,
      definition: string,
    ): Promise<void> => {
      if (!(await columnExists(tableName, columnName))) {
        await payload.db.drizzle.run(
          drizzleSql.raw(`ALTER TABLE "${tableName}" ADD COLUMN ${definition}`),
        )
      }
    }

    const dropColumnIfExists = async (tableName: string, columnName: string): Promise<void> => {
      if (await columnExists(tableName, columnName)) {
        // SQLite refuses to drop a column referenced by an index, so drop those indexes first.
        const indexes = (await payload.db.drizzle.all(
          drizzleSql.raw(
            `SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='${tableName}'`,
          ),
        )) as any[]

        for (const index of indexes) {
          if (typeof index.sql === 'string' && index.sql.includes(columnName)) {
            await payload.db.drizzle.run(drizzleSql.raw(`DROP INDEX IF EXISTS "${index.name}"`))
          }
        }

        await payload.db.drizzle.run(
          drizzleSql.raw(`ALTER TABLE "${tableName}" DROP COLUMN ${columnName}`),
        )
      }
    }

    beforeEach(async () => {
      const drizzle = payload.db.drizzle

      // testMigrationPosts: title is NOT localized, so versions have no locales table pre-migration.
      await drizzle.run(drizzleSql.raw(`DROP TABLE IF EXISTS _test_migration_posts_v_locales`))
      await addColumnIfMissing(
        '_test_migration_posts_v',
        'version__status',
        `version__status TEXT DEFAULT 'draft'`,
      )
      await addColumnIfMissing('_test_migration_posts_v', 'snapshot', `snapshot INTEGER`)
      await addColumnIfMissing('test_migration_posts', '_status', `_status TEXT DEFAULT 'draft'`)
      await drizzle.run(drizzleSql.raw(`DELETE FROM _test_migration_posts_v`))
      await drizzle.run(drizzleSql.raw(`DELETE FROM test_migration_posts`))

      // testMigrationArticles: title IS localized, so locales tables exist.
      await addColumnIfMissing(
        '_test_migration_articles_v',
        'version__status',
        `version__status TEXT DEFAULT 'draft'`,
      )
      await addColumnIfMissing('_test_migration_articles_v', 'snapshot', `snapshot INTEGER`)
      await dropColumnIfExists('_test_migration_articles_v_locales', 'version__status')
      await addColumnIfMissing('test_migration_articles', '_status', `_status TEXT DEFAULT 'draft'`)
      await dropColumnIfExists('test_migration_articles_locales', '_status')
      await drizzle.run(drizzleSql.raw(`DELETE FROM _test_migration_articles_v_locales`))
      await drizzle.run(drizzleSql.raw(`DELETE FROM _test_migration_articles_v`))
      await drizzle.run(drizzleSql.raw(`DELETE FROM test_migration_articles_locales`))
      await drizzle.run(drizzleSql.raw(`DELETE FROM test_migration_articles`))
    })

    describe('Scenario 1: Creating new locales table', () => {
      it('should migrate non-localized _status to localized', async () => {
        const drizzle = payload.db.drizzle

        const post1 = await payload.create({
          collection: 'testMigrationPosts',
          data: { title: 'Post 1' },
        })

        await payload.update({
          id: post1.id,
          collection: 'testMigrationPosts',
          data: { _status: 'published', title: 'Post 1 Updated' },
        })

        const beforeVersions = (await drizzle.all(
          drizzleSql.raw(
            `SELECT id, parent_id as parent, version__status as _status FROM _test_migration_posts_v WHERE parent_id = ${post1.id}`,
          ),
        )) as any[]

        expect(beforeVersions.length).toBeGreaterThan(0)

        await migrateSqliteLocalizeStatus({
          collectionSlug: 'testMigrationPosts',
          db: drizzle,
          payload,
        })

        expect(await tableExists('_test_migration_posts_v_locales')).toBe(true)
        expect(await columnExists('_test_migration_posts_v', 'version__status')).toBe(false)

        const localesData = (await drizzle.all(
          drizzleSql.raw(
            `SELECT _locale, _parent_id, version__status as _status FROM _test_migration_posts_v_locales ORDER BY _parent_id, _locale`,
          ),
        )) as any[]

        expect(localesData).toHaveLength(beforeVersions.length * 3)

        const enRows = localesData.filter((row) => row._locale === 'en')
        const esRows = localesData.filter((row) => row._locale === 'es')
        const deRows = localesData.filter((row) => row._locale === 'de')

        expect(enRows.length).toBeGreaterThan(0)
        expect(esRows).toHaveLength(enRows.length)
        expect(deRows).toHaveLength(enRows.length)

        enRows.forEach((enRow, idx) => {
          expect(enRow._status).toBe(esRows[idx]._status)
          expect(enRow._status).toBe(deRows[idx]._status)
        })
      })
    })

    describe('Scenario 2: Adding to existing locales table', () => {
      it('should add version__status column to existing locales table', async () => {
        const drizzle = payload.db.drizzle

        const articleResult = (await drizzle.all(
          drizzleSql.raw(
            `INSERT INTO test_migration_articles (_status, created_at, updated_at) VALUES ('draft', datetime('now'), datetime('now')) RETURNING id`,
          ),
        )) as any[]
        const articleId = articleResult[0].id

        await drizzle.run(
          drizzleSql.raw(
            `INSERT INTO test_migration_articles_locales (_locale, _parent_id, title) VALUES ('en', ${articleId}, 'English Title'), ('es', ${articleId}, 'Titulo'), ('de', ${articleId}, 'German Title')`,
          ),
        )

        const draftVersionResult = (await drizzle.all(
          drizzleSql.raw(
            `INSERT INTO _test_migration_articles_v (parent_id, version__status, created_at, updated_at) VALUES (${articleId}, 'draft', datetime('now'), datetime('now')) RETURNING id`,
          ),
        )) as any[]
        const draftVersionId = draftVersionResult[0].id

        for (const locale of ['en', 'es', 'de']) {
          await drizzle.run(
            drizzleSql.raw(
              `INSERT INTO _test_migration_articles_v_locales (_locale, _parent_id) VALUES ('${locale}', ${draftVersionId})`,
            ),
          )
        }

        const publishedVersionResult = (await drizzle.all(
          drizzleSql.raw(
            `INSERT INTO _test_migration_articles_v (parent_id, version__status, created_at, updated_at) VALUES (${articleId}, 'published', datetime('now', '+1 second'), datetime('now', '+1 second')) RETURNING id`,
          ),
        )) as any[]
        const publishedVersionId = publishedVersionResult[0].id

        for (const locale of ['en', 'es', 'de']) {
          await drizzle.run(
            drizzleSql.raw(
              `INSERT INTO _test_migration_articles_v_locales (_locale, _parent_id) VALUES ('${locale}', ${publishedVersionId})`,
            ),
          )
        }

        await migrateSqliteLocalizeStatus({
          collectionSlug: 'testMigrationArticles',
          db: drizzle,
          payload,
        })

        expect(await columnExists('_test_migration_articles_v_locales', 'version__status')).toBe(
          true,
        )

        const localesData = (await drizzle.all(
          drizzleSql.raw(
            `SELECT l._locale, l.version__status as _status FROM _test_migration_articles_v_locales l JOIN _test_migration_articles_v v ON l._parent_id = v.id WHERE v.parent_id = ${articleId} ORDER BY v.created_at DESC, l._locale`,
          ),
        )) as any[]

        expect(localesData.length).toBeGreaterThan(0)
        localesData.forEach((row) => {
          expect(['draft', 'published']).toContain(row._status)
        })
      })
    })

    describe('Scenario 3: Test publishedLocale handling', () => {
      it('should handle publishedLocale correctly', async () => {
        const drizzle = payload.db.drizzle

        await drizzle.run(drizzleSql.raw(`DELETE FROM _test_migration_articles_v`))
        await drizzle.run(drizzleSql.raw(`DELETE FROM _test_migration_articles_v_locales`))

        const articleResult = (await drizzle.all(
          drizzleSql.raw(
            `INSERT INTO test_migration_articles (_status, created_at, updated_at) VALUES ('draft', datetime('now'), datetime('now')) RETURNING id`,
          ),
        )) as any[]
        const parentId = articleResult[0].id

        const insertVersion = async (
          status: 'draft' | 'published',
          publishedLocale: null | string,
          intervalSeconds: number,
        ) => {
          const publishedLocaleValue = publishedLocale === null ? 'NULL' : `'${publishedLocale}'`
          const result = (await drizzle.all(
            drizzleSql.raw(
              `INSERT INTO _test_migration_articles_v (parent_id, version__status, published_locale, created_at, updated_at) VALUES (${parentId}, '${status}', ${publishedLocaleValue}, datetime('now', '+${intervalSeconds} seconds'), datetime('now', '+${intervalSeconds} seconds')) RETURNING id`,
            ),
          )) as any[]
          const versionId = result[0]?.id

          for (const locale of ['en', 'es', 'de']) {
            await drizzle.run(
              drizzleSql.raw(
                `INSERT INTO _test_migration_articles_v_locales (_locale, _parent_id) VALUES ('${locale}', ${versionId})`,
              ),
            )
          }
        }

        await insertVersion('draft', null, 0)
        await insertVersion('published', null, 1)
        await insertVersion('published', 'en', 2)
        await insertVersion('draft', null, 3)
        await insertVersion('published', 'es', 4)
        await insertVersion('published', 'de', 5)

        await migrateSqliteLocalizeStatus({
          collectionSlug: 'testMigrationArticles',
          db: drizzle,
          payload,
        })

        const afterLocales = (await drizzle.all(
          drizzleSql.raw(
            `SELECT v.id as version_id, l._locale, l.version__status as _status FROM _test_migration_articles_v v JOIN _test_migration_articles_v_locales l ON l._parent_id = v.id WHERE v.parent_id = ${parentId} ORDER BY v.created_at ASC, l._locale ASC`,
          ),
        )) as any[]

        const versionGroups = afterLocales.reduce(
          (acc, row) => {
            if (!acc[row.version_id]) {
              acc[row.version_id] = []
            }
            acc[row.version_id].push(row)
            return acc
          },
          {} as Record<string, any[]>,
        )

        const versions = Object.values(versionGroups)

        expect(versions[0].every((row) => row._status === 'draft')).toBe(true)
        expect(versions[1].every((row) => row._status === 'published')).toBe(true)

        const v3 = versions[2]
        expect(v3.find((r) => r._locale === 'en')._status).toBe('published')
        expect(v3.find((r) => r._locale === 'es')._status).toBe('published')
        expect(v3.find((r) => r._locale === 'de')._status).toBe('published')

        expect(versions[3].every((row) => row._status === 'draft')).toBe(true)

        const v5 = versions[4]
        expect(v5.find((r) => r._locale === 'en')._status).toBe('draft')
        expect(v5.find((r) => r._locale === 'es')._status).toBe('published')
        expect(v5.find((r) => r._locale === 'de')._status).toBe('draft')

        const v6 = versions[5]
        expect(v6.find((r) => r._locale === 'en')._status).toBe('draft')
        expect(v6.find((r) => r._locale === 'es')._status).toBe('published')
        expect(v6.find((r) => r._locale === 'de')._status).toBe('published')
      })
    })

    describe('Scenario 4: Skip collections without versions', () => {
      it('should skip migration for collections without versions enabled', async () => {
        const doc = await payload.create({
          collection: 'testNoVersions',
          data: { title: 'Test document' },
        })

        expect(doc.id).toBeDefined()

        await expect(
          migrateSqliteLocalizeStatus({
            collectionSlug: 'testNoVersions',
            db: payload.db.drizzle,
            payload,
          }),
        ).resolves.not.toThrow()

        expect(await tableExists('_test_no_versions_v')).toBe(false)
      })
    })

    async function tableExists(tableName: string): Promise<boolean> {
      const rows = (await payload.db.drizzle.all(
        drizzleSql.raw(
          `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
        ),
      )) as any[]
      return Number(rows[0]?.count ?? 0) > 0
    }
  })

  describe.skipIf(process.env.PAYLOAD_DATABASE !== 'mongodb')('MongoDB', () => {
    // Force collection and index creation to finish before the timed writes below.
    // With autoIndex enabled on a fresh database, the first write to a versions
    // collection kicks off async index builds; a subsequent write can then race
    // with that catalog change and fail with a transient "catalog changes" error.
    // Model.init() resolves once autoCreate and autoIndex have completed.
    beforeAll(async () => {
      const db = payload.db as any
      const slugs = ['testMigrationPosts', 'testMigrationArticles']

      for (const slug of slugs) {
        await db.collections?.[slug]?.init?.()
        await db.versions?.[slug]?.init?.()
      }
    })

    describe('MongoDB version status migration', () => {
      it('should migrate version._status from string to per-locale object', async () => {
        // Step 1: Create a post with a version
        const post = await payload.create({
          collection: 'testMigrationPosts',
          data: { title: 'MongoDB Test Post' },
        })

        // Publish the post
        await payload.update({
          id: post.id,
          collection: 'testMigrationPosts',
          data: { _status: 'published', title: 'MongoDB Test Post Published' },
        })

        // Step 2: Get MongoDB connection and verify "before" state
        const connection = (payload.db as any).connection
        const versionsCollection = '_testmigrationposts_versions' // MongoDB uses lowercase

        // MongoDB stores parent as ObjectId, not string
        const beforeVersions = await connection
          .collection(versionsCollection)
          .find({ parent: new Types.ObjectId(post.id) })
          .toArray()

        expect(beforeVersions.length).toBeGreaterThan(0)
        // Verify version._status is currently a string
        const latestVersion = beforeVersions[beforeVersions.length - 1]
        expect(typeof latestVersion.version._status).toBe('string')

        // Step 3: Run the migration
        await localizeStatus({
          collectionSlug: 'testMigrationPosts',
          payload,
        })

        // Step 4: Verify "after" state - version._status should now be an object
        const afterVersions = await connection
          .collection(versionsCollection)
          .find({ parent: new Types.ObjectId(post.id) })
          .toArray()

        expect(afterVersions.length).toBeGreaterThan(0)
        const migratedVersion = afterVersions[afterVersions.length - 1]
        expect(typeof migratedVersion.version._status).toBe('object')
        expect(migratedVersion.version._status).toHaveProperty('en')
        expect(migratedVersion.version._status).toHaveProperty('es')
        expect(migratedVersion.version._status).toHaveProperty('de')

        // Verify statuses match the published state (all locales published)
        expect(migratedVersion.version._status.en).toBe('published')
        expect(migratedVersion.version._status.es).toBe('published')
        expect(migratedVersion.version._status.de).toBe('published')
      })

      it('should handle publishedLocale when migrating', async () => {
        // This test simulates OLD data that was created before localizeStatus existed.
        // Old data has _status as a string and publishedLocale to indicate which locale was published.
        // We insert raw version documents to replicate what old Payload code would have written.
        const connection = (payload.db as any).connection
        const versionsCollection = '_testmigrationarticles_versions'
        const mainCollection = 'testmigrationarticles'

        // Step 1: Insert a main collection doc (old format)
        const { insertedId: articleId } = await connection.collection(mainCollection).insertOne({
          title: { en: 'Published Article' },
          _status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Step 2: Insert an old-format version with publishedLocale: 'en'
        // This simulates what the old Payload code would write when publishing a single locale.
        await connection.collection(versionsCollection).insertOne({
          parent: articleId,
          publishedLocale: 'en',
          latest: true,
          version: {
            title: { en: 'Published Article' },
            _status: 'published',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // Step 3: Run the migration
        await localizeStatus({
          collectionSlug: 'testMigrationArticles',
          payload,
        })

        // Step 4: Verify the latest version has correct per-locale statuses
        const versions = await connection
          .collection(versionsCollection)
          .find({ parent: articleId })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()

        expect(versions).toHaveLength(1)
        const latestVersion = versions[0]

        // English should be published, other locales should be draft
        expect(latestVersion.version._status.en).toBe('published')
        expect(latestVersion.version._status.es).toBe('draft')
        expect(latestVersion.version._status.de).toBe('draft')
      })
    })
  })
})
