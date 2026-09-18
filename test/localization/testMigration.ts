#!/usr/bin/env tsx
/**
 * Interactive test script for localizeStatus migration
 *
 * Usage:
 *   # PostgreSQL:
 *   PAYLOAD_DATABASE=postgres tsx test/localization/testMigration.ts
 *
 *   # MongoDB:
 *   PAYLOAD_DATABASE=mongodb tsx test/localization/testMigration.ts
 */

import { localizeStatus } from '@payloadcms/db-mongodb/migration-utils'
import { sql } from '@payloadcms/db-postgres'
import { migratePostgresLocalizeStatus } from '@payloadcms/db-postgres/migration-utils'
import { Types } from 'mongoose'
import { getPayload } from 'payload'

import { resetAndSeed } from '../__helpers/shared/clearAndSeed/resetAndSeed.js'
import { getTestDataConfig } from '../__helpers/shared/clearAndSeed/testDataConfig.js'
import testConfig from './localizeStatus.config.js'

async function main() {
  console.log('🚀 Starting localizeStatus migration test...\n')

  const dbType = process.env.PAYLOAD_DATABASE || 'mongodb'
  console.log(`Database: ${dbType}\n`)

  // Initialize Payload
  const config = await testConfig
  const payload = await getPayload({ config, cron: true })
  const testDataConfig = getTestDataConfig(config)

  if (!testDataConfig) {
    throw new Error('Test suite metadata was not registered by buildConfigWithDefaults.')
  }

  await resetAndSeed({ payload, ...testDataConfig })

  console.log('✅ Payload initialized\n')

  // Step 1: Create test data
  console.log('📝 Creating test data...')
  const post = await payload.create({
    collection: 'testMigrationPosts',
    data: { title: 'Test Post' },
  })
  console.log(`   Created post: ${post.id}`)

  await payload.update({
    id: post.id,
    collection: 'testMigrationPosts',
    data: { _status: 'published', title: 'Published Post' },
  })
  console.log(`   Published post: ${post.id}\n`)

  // Step 2: Check "before" state
  console.log('🔍 Checking BEFORE state...')
  if (dbType === 'mongodb') {
    const connection = (payload.db as any).connection
    const versionsCollection = '_testmigrationposts_versions'
    const versions = await connection
      .collection(versionsCollection)
      .find({ parent: new Types.ObjectId(post.id) })
      .toArray()

    console.log(`   Found ${versions.length} versions`)
    if (versions.length > 0) {
      const latest = versions[versions.length - 1]
      console.log(`   Latest version._status type: ${typeof latest.version._status}`)
      console.log(`   Latest version._status value: ${latest.version._status}`)
    }
  } else {
    const db = payload.db as any
    const result = await db.drizzle.execute(sql`
      SELECT id, version__status as _status
      FROM _test_migration_posts_v
      WHERE parent_id = ${post.id}
      ORDER BY created_at DESC
      LIMIT 1
    `)
    if (result.rows.length > 0) {
      console.log(`   Found ${result.rows.length} versions`)
      console.log(`   Latest version._status: ${result.rows[0]._status}`)
    }
  }
  console.log()

  // Step 3: Run migration
  console.log('🔄 Running UP migration...')
  if (dbType === 'mongodb') {
    await localizeStatus({
      collectionSlug: 'testMigrationPosts',
      payload,
    })
  } else {
    await migratePostgresLocalizeStatus({
      collectionSlug: 'testMigrationPosts',
      db: payload.db,
      payload,
      sql,
    })
  }
  console.log('✅ UP migration completed\n')

  // Step 4: Check "after" state
  console.log('🔍 Checking AFTER state...')
  if (dbType === 'mongodb') {
    const connection = (payload.db as any).connection
    const versionsCollection = '_testmigrationposts_versions'
    const versions = await connection
      .collection(versionsCollection)
      .find({ parent: new Types.ObjectId(post.id) })
      .toArray()

    if (versions.length > 0) {
      const latest = versions[versions.length - 1]
      console.log(`   Latest version._status type: ${typeof latest.version._status}`)
      console.log(
        `   Latest version._status value:`,
        JSON.stringify(latest.version._status, null, 2),
      )
    }
  } else {
    const db = payload.db as any
    const result = await db.drizzle.execute(sql`
      SELECT v.id as version_id, l._locale, l.version__status as _status
      FROM _test_migration_posts_v v
      JOIN _test_migration_posts_v_locales l ON l._parent_id = v.id
      WHERE v.parent_id = ${post.id}
      ORDER BY v.created_at DESC, l._locale
      LIMIT 3
    `)
    if (result.rows.length > 0) {
      console.log('   Localized statuses:')
      result.rows.forEach((row: any) => {
        console.log(`     ${row._locale}: ${row._status}`)
      })
    }
  }
  console.log()

  // Cleanup
  await payload.destroy()
  console.log('✨ Test completed successfully!')
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
