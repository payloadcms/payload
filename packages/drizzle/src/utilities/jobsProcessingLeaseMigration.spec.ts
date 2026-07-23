import type { Client } from '@libsql/client'
import type { Payload } from 'payload'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { existsSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import {
  buildDynamicPredefinedJobsProcessingLeaseMigration,
  migrateJobsProcessingLease,
} from './jobsProcessingLeaseMigration.js'

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

  it('should run the SQLite migration up and down', async () => {
    client = createClient({ url: ':memory:' })
    const db = drizzle(client)
    await client.execute(
      'CREATE TABLE "custom_jobs" ("id" integer primary key, "processing" integer DEFAULT false)',
    )
    await client.execute(
      'CREATE INDEX "custom_jobs_processing_idx" ON "custom_jobs" ("processing")',
    )
    await client.execute(
      'INSERT INTO "custom_jobs" ("id", "processing") VALUES (1, true), (2, false)',
    )

    await migrateJobsProcessingLease({
      db,
      dialect: 'sqlite',
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

    await migrateJobsProcessingLease({
      db,
      dialect: 'sqlite',
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
  })

  it('should run PostgreSQL statements with custom names', async () => {
    const execute = vi.fn()
    const raw = vi.fn(sql.raw)

    await migrateJobsProcessingLease({
      db: { execute },
      dialect: 'postgres',
      direction: 'up',
      newIndexName: 'custom_jobs_processing_until_idx',
      oldIndexName: 'custom_jobs_processing_idx',
      schemaName: 'custom_schema',
      sql: { raw },
      tableName: 'custom_jobs',
    })

    expect(raw.mock.calls.map(([statement]) => statement)).toContain(
      'UPDATE "custom_schema"."custom_jobs" SET "processing_until" = \'1970-01-01T00:00:00.000Z\' WHERE "processing" = true',
    )
    expect(raw.mock.calls.map(([statement]) => statement)).toContain(
      'DROP INDEX IF EXISTS "custom_schema"."custom_jobs_processing_idx"',
    )
    expect(execute).toHaveBeenCalledTimes(6)
  })

  it('should generate a migration using the adapter names', async () => {
    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'payload-jobs-migration-'))
    temporaryDirectories.push(temporaryDirectory)
    const filePath = path.join(temporaryDirectory, 'migration')
    const dynamic = buildDynamicPredefinedJobsProcessingLeaseMigration({
      dialect: 'postgres',
      packageName: '@payloadcms/db-postgres',
    })
    const migration = await dynamic({
      filePath,
      payload: {
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
        } as unknown as DrizzleAdapter,
      } as Payload,
    })

    expect(existsSync(`${filePath}.json`)).toBe(true)
    expect(migration.imports).toContain('@payloadcms/db-postgres/migration-utils')
    expect(migration.upSQL).toContain("direction: 'up'")
    expect(migration.upSQL).toContain('custom_jobs_processing_until_idx')
    expect(migration.downSQL).toContain("direction: 'down'")
  })
})
