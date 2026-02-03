import type { Payload } from 'payload'

import { sql } from '@payloadcms/db-postgres'
import { Types } from 'mongoose'
import path from 'path'
import { localizeStatus } from 'payload/migrations'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('localizeStatus migration', () => {
  beforeAll(async () => {
    const result = await initPayloadInt(dirname, undefined, undefined, 'localizeStatus.config.ts')
    payload = result.payload
  })
  afterAll(async () => {
    if (payload?.db && typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe.skipIf(process.env.PAYLOAD_DATABASE !== 'postgres')('PostgreSQL', () => {
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
        await localizeStatus.up({
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

        // Step 5: Test rollback
        await localizeStatus.down({
          collectionSlug: 'testMigrationPosts',
          db,
          payload,
          sql,
        })

        // Verify _status column restored to main table
        const afterDownColumnCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_posts_v'
          AND column_name = 'version__status'
        ) as exists
      `)

        expect(afterDownColumnCheck.rows[0].exists).toBe(true)

        // Verify locales table was dropped
        const afterDownTableCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_posts_v_locales'
        ) as exists
      `)

        expect(afterDownTableCheck.rows[0].exists).toBe(false)
      })
    })

    describe('Scenario 2: Adding to existing locales table', () => {
      it('should add _status column to existing locales table', async () => {
        const db = payload.db

        // At this point, Payload has created:
        // - _test_migration_articles_v table with _status column (because drafts: true)
        // - _test_migration_articles_v_locales table with 'title' column (because title is localized)

        // Step 1: Create test data with localized content
        const article = await payload.create({
          collection: 'testMigrationArticles',
          data: {
            title: 'English Title',
          },
          locale: 'en',
        })

        // Add Spanish translation
        await payload.update({
          id: article.id,
          collection: 'testMigrationArticles',
          data: {
            title: 'Título Español',
          },
          locale: 'es',
        })

        // Publish in English only
        await payload.update({
          id: article.id,
          collection: 'testMigrationArticles',
          data: {
            _status: 'published',
          },
          locale: 'en',
        })

        // Step 2: Run the migration
        await localizeStatus.up({
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
        WHERE v.parent_id = ${article.id}
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

        // Step 5: Test rollback
        await localizeStatus.down({
          collectionSlug: 'testMigrationArticles',
          db,
          payload,
          sql,
        })

        // Verify version__status column dropped from locales table
        const afterDownColumnCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_articles_v_locales'
          AND column_name = 'version__status'
        ) as exists
      `)

        expect(afterDownColumnCheck.rows[0].exists).toBe(false)

        // Verify locales table still exists (because title is still localized)
        const afterDownTableCheck = await db.drizzle.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '_test_migration_articles_v_locales'
        ) as exists
      `)

        expect(afterDownTableCheck.rows[0].exists).toBe(true)
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
        await localizeStatus.up({
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

        // Create a parent article document
        const article = await payload.create({
          collection: 'testMigrationArticles' as any,
          data: {
            title: 'Test Article for publishedLocale',
          },
        })

        const parentId = article.id

        // Delete the auto-created version so we can insert our own manual test versions
        await db.drizzle.execute(sql`
        DELETE FROM _test_migration_articles_v WHERE parent_id = ${parentId}
      `)
        await db.drizzle.execute(sql`
        DELETE FROM _test_migration_articles_v_locales WHERE _parent_id IN (
          SELECT id FROM _test_migration_articles_v WHERE parent_id = ${parentId}
        )
      `)

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
        await localizeStatus.up({
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
          localizeStatus.up({
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

  describe.skipIf(process.env.PAYLOAD_DATABASE !== 'mongodb')('MongoDB', () => {
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
        await localizeStatus.up({
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
        // Step 1: Create an article
        const article = await payload.create({
          collection: 'testMigrationArticles',
          data: { title: 'Article' },
          locale: 'en',
        })

        // Step 2: Publish only English locale
        await payload.update({
          id: article.id,
          collection: 'testMigrationArticles',
          data: { _status: 'published', title: 'Published Article' },
          publishSpecificLocale: 'en',
        })

        // Step 3: Run the migration
        const connection = (payload.db as any).connection
        const versionsCollection = '_testmigrationarticles_versions'
        await localizeStatus.up({
          collectionSlug: 'testMigrationArticles',
          payload,
        })

        // Step 4: Verify the latest version has correct per-locale statuses
        // MongoDB stores parent as ObjectId, not string
        const versions = await connection
          .collection(versionsCollection)
          .find({ parent: new Types.ObjectId(article.id) })
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

      it('should rollback migration correctly', async () => {
        // Step 0: Clear existing data to start fresh (test 1 already migrated this collection)
        const connection = (payload.db as any).connection
        const versionsCollection = '_testmigrationposts_versions' // MongoDB uses lowercase
        const mainCollection = 'testmigrationposts'

        await connection.collection(versionsCollection).deleteMany({})
        await connection.collection(mainCollection).deleteMany({})

        // Step 1: Create test data
        const post = await payload.create({
          collection: 'testMigrationPosts',
          data: { title: 'Rollback Test' },
        })

        await payload.update({
          id: post.id,
          collection: 'testMigrationPosts',
          data: { _status: 'published' },
        })

        // Step 2: Run up migration
        await localizeStatus.up({
          collectionSlug: 'testMigrationPosts',
          payload,
        })

        // Verify status is now an object (check latest version)
        const afterUpVersions = await connection
          .collection(versionsCollection)
          .find({ parent: new Types.ObjectId(post.id) })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()
        const afterUp = afterUpVersions[0]
        expect(typeof afterUp.version._status).toBe('object')

        // Step 3: Run down migration
        await localizeStatus.down({
          collectionSlug: 'testMigrationPosts',
          payload,
        })

        // Step 4: Verify status is back to a string
        // Get the LATEST version (most recent)
        const afterDownVersions = await connection
          .collection(versionsCollection)
          .find({ parent: new Types.ObjectId(post.id) })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()
        const afterDown = afterDownVersions[0]

        expect(typeof afterDown.version._status).toBe('string')
        expect(afterDown.version._status).toBe('published')
      })
    })
  })
})
