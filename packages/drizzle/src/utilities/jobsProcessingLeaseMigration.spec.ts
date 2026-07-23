import type { Client } from '@libsql/client'
import type { Payload } from 'payload'

import { createClient } from '@libsql/client'
import {
  index as postgresIndex,
  integer as postgresInteger,
  pgSchema,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import {
  index as sqliteIndex,
  integer as sqliteInteger,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { requireDrizzleKit as requirePostgresDrizzleKit } from '../postgres/requireDrizzleKit.js'
import { requireDrizzleKit as requireSqliteDrizzleKit } from '../sqlite/requireDrizzleKit.js'
import { buildDynamicPredefinedJobsProcessingLeaseMigration } from './jobsProcessingLeaseMigration.js'

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<void>

const runSQLiteMigration = async ({
  client,
  code,
}: {
  client: Client
  code: string
}): Promise<void> => {
  const run = new AsyncFunction('db', 'sql', code)

  await run(
    { run: (statement: string) => client.execute(statement) },
    { raw: (statement: string) => statement },
  )
}

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
    const schema = {
      jobs: sqliteTable(
        'custom_jobs',
        {
          id: sqliteInteger('id').primaryKey(),
          processingToken: text('processing_token'),
          processingUntil: text('processing_until'),
        },
        (table) => [sqliteIndex('custom_jobs_processing_until_idx').on(table.processingUntil)],
      ),
    }
    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'payload-jobs-migration-'))
    temporaryDirectories.push(temporaryDirectory)
    const dynamic = buildDynamicPredefinedJobsProcessingLeaseMigration({ dialect: 'sqlite' })
    const migration = await dynamic({
      filePath: path.join(temporaryDirectory, 'migration'),
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
          requireDrizzleKit: requireSqliteDrizzleKit,
          schema,
          tableNameMap: new Map([['payload_jobs', 'custom_jobs']]),
        } as unknown as DrizzleAdapter,
      } as Payload,
    })

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
    await runSQLiteMigration({ client, code: migration.upSQL! })

    const migratedJobs = await client.execute(
      'SELECT "id", "processing_until", "processing_token" FROM "custom_jobs" ORDER BY "id"',
    )
    expect(migratedJobs.rows).toEqual([
      { id: 1, processing_token: null, processing_until: '1970-01-01T00:00:00.000Z' },
      { id: 2, processing_token: null, processing_until: null },
    ])

    await runSQLiteMigration({ client, code: migration.downSQL! })

    const restoredJobs = await client.execute(
      'SELECT "id", "processing" FROM "custom_jobs" ORDER BY "id"',
    )
    expect(restoredJobs.rows).toEqual([
      { id: 1, processing: 1 },
      { id: 2, processing: 0 },
    ])
  })

  it('should generate PostgreSQL statements with custom names', async () => {
    const customSchema = pgSchema('custom_schema')
    const schema = {
      jobs: customSchema.table(
        'custom_jobs',
        {
          id: postgresInteger('id').primaryKey(),
          processingToken: varchar('processing_token'),
          processingUntil: timestamp('processing_until', {
            mode: 'string',
            precision: 3,
            withTimezone: true,
          }),
        },
        (table) => [postgresIndex('custom_jobs_processing_until_idx').on(table.processingUntil)],
      ),
    }
    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'payload-jobs-migration-'))
    temporaryDirectories.push(temporaryDirectory)
    const dynamic = buildDynamicPredefinedJobsProcessingLeaseMigration({ dialect: 'postgres' })
    const migration = await dynamic({
      filePath: path.join(temporaryDirectory, 'migration'),
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
          requireDrizzleKit: requirePostgresDrizzleKit,
          schema,
          schemaName: 'custom_schema',
          tableNameMap: new Map([['payload_jobs', 'custom_jobs']]),
        } as unknown as DrizzleAdapter,
      } as Payload,
    })

    expect(migration.upSQL).toContain(
      'UPDATE \\"custom_schema\\".\\"custom_jobs\\" SET \\"processing_until\\"',
    )
    expect(migration.upSQL).toContain('custom_jobs_processing_until_idx')
    expect(migration.upSQL).toContain('custom_jobs_processing_idx')
    expect(migration.downSQL).toContain(
      'UPDATE \\"custom_schema\\".\\"custom_jobs\\" SET \\"processing\\" = true',
    )
  })
})
