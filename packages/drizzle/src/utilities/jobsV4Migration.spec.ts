import type { Client } from '@libsql/client'
import type { Payload } from 'payload'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { index as pgIndex, jsonb, pgSchema, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { existsSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { requireDrizzleKit as requirePostgresDrizzleKit } from '../postgres/requireDrizzleKit.js'
import { requireDrizzleKit } from '../sqlite/requireDrizzleKit.js'
import { buildDynamicPredefinedJobsV4Migration, migrateJobsV4 } from './jobsV4Migration.js'

const jobsLogTable = sqliteTable('custom_jobs_log', {
  id: text('id').primaryKey(),
  input: text('input', { mode: 'json' }).notNull(),
  parentTaskID: text('parent_task_i_d'),
  parentTaskSlug: text('parent_task_slug'),
})

const jobsTable = sqliteTable(
  'custom_jobs',
  {
    concurrencyKey: text('concurrency_key'),
    id: integer('id').primaryKey(),
    meta: text('meta', { mode: 'json' }),
    processingToken: text('processing_token'),
    processingUntil: text('processing_until'),
  },
  (table) => [
    index('custom_jobs_concurrency_key_idx').on(table.concurrencyKey),
    index('custom_jobs_processing_until_idx').on(table.processingUntil),
  ],
)

const jobsStatsTable = sqliteTable('custom_jobs_stats', {
  createdAt: text('created_at'),
  id: integer('id').primaryKey(),
  stats: text('stats', { mode: 'json' }),
  updatedAt: text('updated_at'),
})

const customSchema = pgSchema('custom_schema')
const parentTaskSlug = customSchema.enum('custom_jobs_log_parent_task_slug', [
  'inline',
  'sampleTask',
])
const postgresJobsLogTable = customSchema.table('custom_jobs_log', {
  id: varchar('id').primaryKey(),
  input: jsonb('input').notNull(),
  parentTaskID: varchar('parent_task_i_d'),
  parentTaskSlug: parentTaskSlug('parent_task_slug'),
})
const postgresJobsTable = customSchema.table(
  'custom_jobs',
  {
    concurrencyKey: varchar('concurrency_key'),
    id: serial('id').primaryKey(),
    meta: jsonb('meta'),
    processingToken: varchar('processing_token'),
    processingUntil: timestamp('processing_until', {
      mode: 'string',
      precision: 3,
      withTimezone: true,
    }),
  },
  (table) => [
    pgIndex('custom_jobs_concurrency_key_idx').on(table.concurrencyKey),
    pgIndex('custom_jobs_processing_until_idx').on(table.processingUntil),
  ],
)
const postgresJobsStatsTable = customSchema.table('custom_jobs_stats', {
  createdAt: timestamp('created_at', {
    mode: 'string',
    precision: 3,
    withTimezone: true,
  }),
  id: serial('id').primaryKey(),
  stats: jsonb('stats'),
  updatedAt: timestamp('updated_at', {
    mode: 'string',
    precision: 3,
    withTimezone: true,
  }),
})

const getRawTables = (): DrizzleAdapter['rawTables'] => ({
  custom_jobs: {
    columns: {
      concurrencyKey: { name: 'concurrency_key', type: 'varchar' },
      id: { name: 'id', primaryKey: true, type: 'serial' },
      meta: { name: 'meta', type: 'jsonb' },
      processingToken: { name: 'processing_token', type: 'varchar' },
      processingUntil: {
        mode: 'string',
        name: 'processing_until',
        precision: 3,
        type: 'timestamp',
        withTimezone: true,
      },
    },
    indexes: {
      concurrencyKey: {
        name: 'custom_jobs_concurrency_key_idx',
        on: 'concurrencyKey',
      },
      processingUntil: {
        name: 'custom_jobs_processing_until_idx',
        on: 'processingUntil',
      },
    },
    name: 'custom_jobs',
  },
  custom_jobs_log: {
    columns: {
      _order: { name: '_order', notNull: true, type: 'integer' },
      _parentID: { name: '_parent_id', notNull: true, type: 'integer' },
      completedAt: {
        mode: 'string',
        name: 'completed_at',
        notNull: true,
        precision: 3,
        type: 'timestamp',
        withTimezone: true,
      },
      error: { name: 'error', type: 'jsonb' },
      executedAt: {
        mode: 'string',
        name: 'executed_at',
        notNull: true,
        precision: 3,
        type: 'timestamp',
        withTimezone: true,
      },
      id: { name: 'id', primaryKey: true, type: 'text' },
      input: { name: 'input', notNull: true, type: 'jsonb' },
      output: { name: 'output', type: 'jsonb' },
      parent_taskID: { name: 'parent_task_i_d', type: 'varchar' },
      parent_taskSlug: {
        enumName: 'custom_jobs_log_parent_task_slug',
        name: 'parent_task_slug',
        options: ['inline', 'sampleTask'],
        type: 'enum',
      },
      state: {
        enumName: 'custom_jobs_log_state',
        name: 'state',
        notNull: true,
        options: ['failed', 'succeeded'],
        type: 'enum',
      },
      taskID: { name: 'task_i_d', notNull: true, type: 'varchar' },
      taskSlug: {
        enumName: 'custom_jobs_log_task_slug',
        name: 'task_slug',
        notNull: true,
        options: ['inline', 'sampleTask'],
        type: 'enum',
      },
    },
    foreignKeys: {
      parent: {
        columns: ['_parentID'],
        foreignColumns: [{ name: 'id', table: 'custom_jobs' }],
        name: 'custom_jobs_log_parent_id_fk',
        onDelete: 'cascade',
      },
    },
    indexes: {
      order: {
        name: 'custom_jobs_log_order_idx',
        on: '_order',
      },
      parent: {
        name: 'custom_jobs_log_parent_id_idx',
        on: '_parentID',
      },
    },
    name: 'custom_jobs_log',
  },
  custom_jobs_stats: {
    columns: {
      createdAt: {
        mode: 'string',
        name: 'created_at',
        precision: 3,
        type: 'timestamp',
        withTimezone: true,
      },
      id: { name: 'id', primaryKey: true, type: 'serial' },
      stats: { name: 'stats', type: 'jsonb' },
      updatedAt: {
        mode: 'string',
        name: 'updated_at',
        precision: 3,
        type: 'timestamp',
        withTimezone: true,
      },
    },
    name: 'custom_jobs_stats',
  },
})

const tableNameMap = new Map([
  ['payload_jobs', 'custom_jobs'],
  ['custom_jobs_log', 'custom_jobs_log'],
  ['payload_jobs_stats', 'custom_jobs_stats'],
])

const createAdapter = (): DrizzleAdapter =>
  ({
    rawTables: getRawTables(),
    requireDrizzleKit,
    schema: {
      jobsLogTable,
      jobsStatsTable,
      jobsTable,
    },
    tableNameMap,
  }) as unknown as DrizzleAdapter

const createPostgresAdapter = (): DrizzleAdapter =>
  ({
    rawTables: getRawTables(),
    requireDrizzleKit: requirePostgresDrizzleKit,
    schema: {
      parentTaskSlug,
      postgresJobsLogTable,
      postgresJobsStatsTable,
      postgresJobsTable,
    },
    schemaName: 'custom_schema',
    tableNameMap,
  }) as unknown as DrizzleAdapter

const createLegacySQLiteTables = async ({
  client,
  optionalFields = false,
}: {
  client: Client
  optionalFields?: boolean
}): Promise<void> => {
  await client.execute(
    `CREATE TABLE "custom_jobs" (
      "id" integer primary key,
      "processing" integer DEFAULT false
      ${optionalFields ? ', "meta" text, "concurrency_key" text' : ''}
    )`,
  )
  await client.execute('CREATE INDEX "custom_jobs_processing_idx" ON "custom_jobs" ("processing")')

  if (optionalFields) {
    await client.execute(
      'CREATE INDEX "custom_jobs_concurrency_key_idx" ON "custom_jobs" ("concurrency_key")',
    )
  }

  await client.execute(
    `CREATE TABLE "custom_jobs_log" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" text PRIMARY KEY NOT NULL,
      "executed_at" text NOT NULL,
      "completed_at" text NOT NULL,
      "task_slug" text NOT NULL,
      "task_i_d" text NOT NULL,
      "input" text,
      "output" text,
      "state" text NOT NULL,
      "error" text
      ${optionalFields ? ', "parent_task_slug" text, "parent_task_i_d" text' : ''},
      CONSTRAINT "custom_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "custom_jobs" ("id") ON UPDATE no action ON DELETE cascade
    )`,
  )
  await client.execute('CREATE INDEX "custom_jobs_log_order_idx" ON "custom_jobs_log" ("_order")')
  await client.execute(
    'CREATE INDEX "custom_jobs_log_parent_id_idx" ON "custom_jobs_log" ("_parent_id")',
  )

  if (optionalFields) {
    await client.execute(
      'CREATE TABLE "custom_jobs_stats" ("id" integer primary key, "stats" text, "created_at" text, "updated_at" text)',
    )
  }
}

describe('jobs v4 predefined migration', () => {
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

  it('should migrate the complete SQLite jobs schema up and down', async () => {
    client = createClient({ url: ':memory:' })
    const db = drizzle(client)
    const payload = { db: createAdapter() } as Payload

    await createLegacySQLiteTables({ client })
    await client.execute(
      'INSERT INTO "custom_jobs" ("id", "processing") VALUES (1, true), (2, false)',
    )
    await client.execute(
      `INSERT INTO "custom_jobs_log" (
        "_order", "_parent_id", "id", "executed_at", "completed_at",
        "task_slug", "task_i_d", "input", "state"
      ) VALUES (1, 1, 'log-1', '2026-01-01', '2026-01-01', 'sampleTask', 'task-1', NULL, 'succeeded')`,
    )

    await migrateJobsV4({
      db,
      dialect: 'sqlite',
      direction: 'up',
      payload,
      sql,
    })

    const migratedJobs = await client.execute(
      'SELECT "id", "processing_until", "processing_token", "meta", "concurrency_key" FROM "custom_jobs" ORDER BY "id"',
    )
    const migratedLog = await client.execute(
      'SELECT "input", "parent_task_slug", "parent_task_i_d" FROM "custom_jobs_log"',
    )
    const migratedLogColumns = await client.execute('PRAGMA table_info("custom_jobs_log")')
    const migratedJobsIndexes = await client.execute('PRAGMA index_list("custom_jobs")')
    const statsTable = await client.execute(
      'SELECT "name" FROM "sqlite_master" WHERE "type" = \'table\' AND "name" = \'custom_jobs_stats\'',
    )

    expect(migratedJobs.rows).toEqual([
      {
        concurrency_key: null,
        id: 1,
        meta: null,
        processing_token: null,
        processing_until: '1970-01-01T00:00:00.000Z',
      },
      {
        concurrency_key: null,
        id: 2,
        meta: null,
        processing_token: null,
        processing_until: null,
      },
    ])
    expect(migratedLog.rows).toEqual([
      {
        input: '{}',
        parent_task_i_d: null,
        parent_task_slug: null,
      },
    ])
    expect(migratedLogColumns.rows.find((column) => column.name === 'input')?.notnull).toBe(1)
    expect(migratedJobsIndexes.rows.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        'custom_jobs_concurrency_key_idx',
        'custom_jobs_processing_until_idx',
      ]),
    )
    expect(statsTable.rows).toEqual([{ name: 'custom_jobs_stats' }])

    await migrateJobsV4({
      db,
      dialect: 'sqlite',
      direction: 'down',
      payload,
      sql,
    })

    const restoredJobs = await client.execute(
      'SELECT "id", "processing" FROM "custom_jobs" ORDER BY "id"',
    )
    const restoredJobsColumns = await client.execute('PRAGMA table_info("custom_jobs")')
    const restoredLogColumns = await client.execute('PRAGMA table_info("custom_jobs_log")')
    const removedStatsTable = await client.execute(
      'SELECT "name" FROM "sqlite_master" WHERE "type" = \'table\' AND "name" = \'custom_jobs_stats\'',
    )

    expect(restoredJobs.rows).toEqual([
      { id: 1, processing: 1 },
      { id: 2, processing: 0 },
    ])
    expect(restoredJobsColumns.rows.map((column) => column.name)).not.toEqual(
      expect.arrayContaining(['concurrency_key', 'meta', 'processing_token', 'processing_until']),
    )
    expect(restoredLogColumns.rows.find((column) => column.name === 'input')?.notnull).toBe(0)
    expect(restoredLogColumns.rows.map((column) => column.name)).not.toEqual(
      expect.arrayContaining(['parent_task_i_d', 'parent_task_slug']),
    )
    expect(removedStatsTable.rows).toEqual([])
  })

  it('should not recreate SQLite jobs fields that already exist', async () => {
    client = createClient({ url: ':memory:' })
    const db = drizzle(client)
    const payload = { db: createAdapter() } as Payload

    await createLegacySQLiteTables({ client, optionalFields: true })

    await migrateJobsV4({
      db,
      dialect: 'sqlite',
      direction: 'up',
      payload,
      sql,
    })

    const jobsColumns = await client.execute('PRAGMA table_info("custom_jobs")')
    const logColumns = await client.execute('PRAGMA table_info("custom_jobs_log")')

    expect(jobsColumns.rows.filter((column) => column.name === 'meta')).toHaveLength(1)
    expect(jobsColumns.rows.filter((column) => column.name === 'concurrency_key')).toHaveLength(1)
    expect(logColumns.rows.filter((column) => column.name === 'parent_task_slug')).toHaveLength(1)
    expect(logColumns.rows.find((column) => column.name === 'input')?.notnull).toBe(1)
  })

  it('should generate one migration that imports the runtime helper', async () => {
    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'payload-jobs-migration-'))
    temporaryDirectories.push(temporaryDirectory)
    const filePath = path.join(temporaryDirectory, 'migration')
    const dynamic = buildDynamicPredefinedJobsV4Migration({
      dialect: 'sqlite',
      packageName: '@payloadcms/db-sqlite',
    })
    const migration = await dynamic({
      filePath,
      payload: {
        db: createAdapter(),
      } as Payload,
    })

    expect(existsSync(`${filePath}.json`)).toBe(true)
    expect(migration.imports).toContain('@payloadcms/db-sqlite/migration-utils')
    expect(migration.upSQL).toContain("direction: 'up'")
    expect(migration.downSQL).toContain("direction: 'down'")
  })

  it('should run explicit PostgreSQL statements with a custom schema', async () => {
    const execute = vi.fn()
    const raw = vi.fn(sql.raw)
    const payload = { db: createPostgresAdapter() } as Payload

    await migrateJobsV4({
      db: { execute },
      dialect: 'postgres',
      direction: 'up',
      payload,
      sql: { raw },
    })

    const upStatements = raw.mock.calls.map(([statement]) => statement)

    expect(upStatements).toContain(
      'ALTER TABLE "custom_schema"."custom_jobs" ADD COLUMN IF NOT EXISTS "processing_until" timestamp(3) with time zone',
    )
    expect(upStatements.join('\n')).toContain('custom_jobs_processing_until_idx')
    expect(upStatements.join('\n')).toContain('custom_jobs_concurrency_key_idx')
    expect(upStatements.join('\n')).toContain('custom_jobs_log_parent_task_slug')
    expect(upStatements.join('\n')).toContain('custom_jobs_stats')
    expect(upStatements.join('\n')).toContain('processing_token')
    expect(upStatements.join('\n')).toContain('parent_task_i_d')
    expect(upStatements.join('\n')).toContain('"input" SET NOT NULL')

    raw.mockClear()

    await migrateJobsV4({
      db: { execute },
      dialect: 'postgres',
      direction: 'down',
      payload,
      sql: { raw },
    })

    const downStatements = raw.mock.calls.map(([statement]) => statement)

    expect(downStatements).toContain(
      'ALTER TABLE "custom_schema"."custom_jobs" ADD COLUMN IF NOT EXISTS "processing" boolean DEFAULT false',
    )
    expect(downStatements).toContain('DROP TABLE IF EXISTS "custom_schema"."custom_jobs_stats"')
  })
})
