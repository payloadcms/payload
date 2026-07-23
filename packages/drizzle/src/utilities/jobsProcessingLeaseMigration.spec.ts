import type { Client } from '@libsql/client'
import type { Payload } from 'payload'

import { createClient } from '@libsql/client'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { migratePostgresJobsProcessingLease } from '../postgres/predefinedMigrations/jobs-processing-lease/index.js'
import { migrateSqliteJobsProcessingLease } from '../sqlite/predefinedMigrations/jobs-processing-lease/index.js'
import { buildDynamicPredefinedJobsProcessingLeaseMigration } from './jobsProcessingLeaseMigration.js'

describe('jobs processing lease predefined migration', () => {
  let client: Client | undefined
  const temporaryDirectories: string[] = []

  afterEach(() => {
    client?.close()
    client = undefined

    for (const directory of temporaryDirectories) {
      rmSync(directory, { force: true, recursive: true })
    }
    temporaryDirectories.length = 0
  })

  it('should migrate SQLite job data up and down', async () => {
    client = createClient({ url: ':memory:' })
    await client.execute(
      'CREATE TABLE "custom_jobs" ("id" integer primary key, "processing" integer DEFAULT false)',
    )
    await client.execute(
      'CREATE INDEX "custom_jobs_processing_idx" ON "custom_jobs" ("processing")',
    )
    await client.execute(
      'INSERT INTO "custom_jobs" ("id", "processing") VALUES (1, true), (2, false)',
    )

    const db = { run: (statement: unknown) => client!.execute(statement as string) }
    const sql = { raw: (statement: string) => statement }

    await migrateSqliteJobsProcessingLease({
      db,
      direction: 'up',
      newIndexName: 'custom_jobs_processing_until_idx',
      oldIndexName: 'custom_jobs_processing_idx',
      sql,
      tableName: 'custom_jobs',
    })

    const migratedJobs = await client.execute(
      'SELECT "id", "processing_until", "processing_token" FROM "custom_jobs" ORDER BY "id"',
    )
    expect(migratedJobs.rows).toEqual([
      { id: 1, processing_token: null, processing_until: '1970-01-01T00:00:00.000Z' },
      { id: 2, processing_token: null, processing_until: null },
    ])

    await migrateSqliteJobsProcessingLease({
      db,
      direction: 'down',
      newIndexName: 'custom_jobs_processing_until_idx',
      oldIndexName: 'custom_jobs_processing_idx',
      sql,
      tableName: 'custom_jobs',
    })

    const restoredJobs = await client.execute(
      'SELECT "id", "processing" FROM "custom_jobs" ORDER BY "id"',
    )
    expect(restoredJobs.rows).toEqual([
      { id: 1, processing: 1 },
      { id: 2, processing: 0 },
    ])
    const restoredColumns = await client.execute('PRAGMA table_info("custom_jobs")')
    expect(restoredColumns.rows.map((column) => column.name)).not.toContain('processing_token')
  })

  it('should produce PostgreSQL statements with quoted custom names', async () => {
    const execute = vi.fn().mockResolvedValue(undefined)

    await migratePostgresJobsProcessingLease({
      db: { execute },
      direction: 'up',
      newIndexName: 'custom_jobs_processing_until_idx',
      oldIndexName: 'custom_jobs_processing_idx',
      schemaName: 'custom_schema',
      sql: { raw: (statement: string) => statement },
      tableName: 'custom_jobs',
    })

    expect(execute.mock.calls.map(([statement]) => statement)).toEqual([
      'ALTER TABLE "custom_schema"."custom_jobs" ADD COLUMN "processing_until" timestamp(3) with time zone',
      'ALTER TABLE "custom_schema"."custom_jobs" ADD COLUMN "processing_token" varchar',
      'UPDATE "custom_schema"."custom_jobs" SET "processing_until" = \'1970-01-01 00:00:00+00\' WHERE "processing" = true',
      'DROP INDEX IF EXISTS "custom_schema"."custom_jobs_processing_idx"',
      'ALTER TABLE "custom_schema"."custom_jobs" DROP COLUMN "processing"',
      'CREATE INDEX "custom_jobs_processing_until_idx" ON "custom_schema"."custom_jobs" USING btree ("processing_until")',
    ])

    execute.mockClear()
    await migratePostgresJobsProcessingLease({
      db: { execute },
      direction: 'down',
      newIndexName: 'custom_jobs_processing_until_idx',
      oldIndexName: 'custom_jobs_processing_idx',
      schemaName: 'custom_schema',
      sql: { raw: (statement: string) => statement },
      tableName: 'custom_jobs',
    })

    expect(execute.mock.calls.map(([statement]) => statement)).toContain(
      'ALTER TABLE "custom_schema"."custom_jobs" DROP COLUMN "processing_token"',
    )
  })

  it('should write a Drizzle snapshot and generate adapter-specific migration code', async () => {
    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'payload-jobs-migration-'))
    temporaryDirectories.push(temporaryDirectory)
    const filePath = path.join(temporaryDirectory, 'migration')
    writeFileSync(
      path.join(temporaryDirectory, 'previous.json'),
      JSON.stringify({
        tables: {
          jobs: {
            indexes: {
              legacy: {
                columns: [{ expression: 'processing' }],
                name: 'legacy_processing_index',
              },
            },
            name: 'custom_jobs',
          },
        },
      }),
    )
    const payload = {
      db: {
        rawTables: {
          custom_jobs: {
            indexes: {
              processingUntil: {
                name: 'custom_jobs_processing_until_idx',
                on: 'processingUntil',
              },
            },
          },
        },
        requireDrizzleKit: () => ({
          generateDrizzleJson: vi.fn().mockResolvedValue({ version: 'test-snapshot' }),
        }),
        schema: {},
        schemaName: 'custom_schema',
        tableNameMap: new Map([['payload_jobs', 'custom_jobs']]),
      },
    } as unknown as Payload

    const dynamic = buildDynamicPredefinedJobsProcessingLeaseMigration({
      dialect: 'postgres',
      packageName: '@payloadcms/db-postgres',
    })
    const migration = await dynamic({ filePath, payload })

    expect(existsSync(`${filePath}.json`)).toBe(true)
    expect(JSON.parse(readFileSync(`${filePath}.json`, 'utf8'))).toEqual({
      version: 'test-snapshot',
    })
    expect(migration.imports).toContain('@payloadcms/db-postgres/migration-utils')
    expect(migration.upSQL).toContain("direction: 'up'")
    expect(migration.upSQL).toContain('custom_jobs_processing_until_idx')
    expect(migration.upSQL).toContain('legacy_processing_index')
    expect(migration.downSQL).toContain("direction: 'down'")
  })
})
