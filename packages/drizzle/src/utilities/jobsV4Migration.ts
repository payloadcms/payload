import type { SQL } from 'drizzle-orm'
import type { DynamicMigrationTemplate, Payload } from 'payload'

import { randomUUID } from 'crypto'
import { writeFileSync } from 'fs'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawColumn, RawTable } from '../types.js'

import { readLatestSnapshot } from './readLatestSnapshot.js'

type Dialect = 'postgres' | 'sqlite'

type MigrationArgs = {
  direction: 'down' | 'up'
  payload: Payload
  sql: { raw: (statement: string) => SQL }
} & (
  | {
      db: {
        execute: (statement: SQL) => unknown
      }
      dialect: 'postgres'
    }
  | {
      db: {
        run: (statement: SQL) => unknown
      }
      dialect: 'sqlite'
    }
)

type JobsV4Metadata = {
  columns: {
    concurrencyKey: string
    input: string
    meta: string
    parentTaskID: string
    parentTaskSlug: string
    processingToken: string
    processingUntil: string
  }
  concurrencyKeyIndexName: string
  idType: DrizzleAdapter['idType']
  jobsTableName: string
  logForeignKeyName: string
  logOrderIndexName: string
  logParentIDType: RawColumn['type']
  logParentIndexName: string
  logTableName: string
  parentTaskSlugEnumName: string
  parentTaskSlugOptions: string[]
  processingIndexName: string
  processingUntilIndexName: string
  statsAutoIncrement: boolean
  statsIDType: RawColumn['type']
  statsTableName: string
}

type SnapshotTable = {
  columns: Record<string, unknown>
  indexes: Record<string, unknown>
  name: string
}

type Snapshot = {
  enums?: Record<string, { name: string }>
  id?: string
  prevId?: string
  tables: Record<string, SnapshotTable>
  version: string
}

const quoteIdentifier = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`

const quoteLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`

const isDuplicateColumnError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes('duplicate column name') || isDuplicateColumnError(error.cause))
  )
}

/** Matches the column types the SQLite schema builder uses for ID columns. */
const getSQLiteIDType = (type: RawColumn['type']): string => {
  if (type === 'integer' || type === 'serial') {
    return 'integer'
  }

  if (type === 'numeric') {
    return 'numeric'
  }

  return type === 'uuid' ? 'text(36)' : 'text'
}

const getDefaultIndexName = (name: string): string => {
  const suffix = '_idx'

  return `${name.slice(0, 60 - suffix.length)}${suffix}`
}

const getRawColumnName = ({ column, table }: { column: string; table: RawTable }): string => {
  const name = table.columns[column]?.name

  if (!name) {
    throw new Error(`Could not find the ${column} column on the ${table.name} table`)
  }

  return name
}

const getRawIndexName = ({ column, table }: { column: string; table: RawTable }): string => {
  const index = Object.values(table.indexes ?? {}).find(({ on }) =>
    Array.isArray(on) ? on.includes(column) : on === column,
  )

  return index?.name ?? getDefaultIndexName(`${table.name}_${toSnakeCase(column)}`)
}

const getJobsV4Metadata = (adapter: DrizzleAdapter): JobsV4Metadata => {
  const jobsTableName = adapter.tableNameMap.get(toSnakeCase('payload-jobs'))
  const statsTableName = adapter.tableNameMap.get(toSnakeCase('payload-jobs-stats'))

  if (!jobsTableName || !statsTableName) {
    throw new Error('Could not find the generated jobs database tables')
  }

  const logTableName = adapter.tableNameMap.get(`${jobsTableName}_log`)
  const jobsTable = adapter.rawTables[jobsTableName]
  const logTable = logTableName ? adapter.rawTables[logTableName] : undefined
  const statsTable = adapter.rawTables[statsTableName]

  if (!jobsTable || !logTable || !statsTable) {
    throw new Error('Could not find the generated jobs database schema')
  }

  const parentTaskSlug = logTable.columns.parent_taskSlug
  const logForeignKey = Object.values(logTable.foreignKeys ?? {})[0]

  if (
    !parentTaskSlug ||
    parentTaskSlug.type !== 'enum' ||
    !('enumName' in parentTaskSlug) ||
    !('options' in parentTaskSlug)
  ) {
    throw new Error('Could not find the generated jobs log metadata')
  }

  return {
    columns: {
      concurrencyKey: getRawColumnName({ column: 'concurrencyKey', table: jobsTable }),
      input: getRawColumnName({ column: 'input', table: logTable }),
      meta: getRawColumnName({ column: 'meta', table: jobsTable }),
      parentTaskID: getRawColumnName({ column: 'parent_taskID', table: logTable }),
      parentTaskSlug: parentTaskSlug.name,
      processingToken: getRawColumnName({ column: 'processingToken', table: jobsTable }),
      processingUntil: getRawColumnName({ column: 'processingUntil', table: jobsTable }),
    },
    concurrencyKeyIndexName: getRawIndexName({
      column: 'concurrencyKey',
      table: jobsTable,
    }),
    idType: adapter.idType,
    jobsTableName,
    logForeignKeyName: logForeignKey?.name ?? `${logTableName}_parent_id_fk`,
    logOrderIndexName: getRawIndexName({ column: '_order', table: logTable }),
    logParentIDType: logTable.columns._parentID.type,
    logParentIndexName: getRawIndexName({ column: '_parentID', table: logTable }),
    logTableName,
    parentTaskSlugEnumName: parentTaskSlug.enumName,
    parentTaskSlugOptions: parentTaskSlug.options,
    processingIndexName: getDefaultIndexName(`${jobsTableName}_processing`),
    processingUntilIndexName: getRawIndexName({
      column: 'processingUntil',
      table: jobsTable,
    }),
    statsAutoIncrement:
      statsTable.columns.id?.type === 'integer' && Boolean(statsTable.columns.id.autoIncrement),
    statsIDType: statsTable.columns.id.type,
    statsTableName,
  }
}

const getQualifiedName = ({
  name,
  dialect,
  schemaName,
}: {
  dialect: Dialect
  name: string
  schemaName: string
}): string => {
  return dialect === 'postgres'
    ? `${quoteIdentifier(schemaName)}.${quoteIdentifier(name)}`
    : quoteIdentifier(name)
}

const getSQLiteLogTableStatements = ({
  includeParent,
  inputRequired,
  metadata,
}: {
  includeParent: boolean
  inputRequired: boolean
  metadata: JobsV4Metadata
}): string[] => {
  /**
   * Rebuild the jobs log table to migrate its parent-task columns and `input`
   * nullability. SQLite cannot alter either constraint in place.
   */
  const { columns, jobsTableName, logTableName } = metadata
  const temporaryTableName = `__new_${logTableName}`
  const parentIDType = getSQLiteIDType(metadata.logParentIDType)
  const parentColumns = includeParent
    ? [
        `${quoteIdentifier(columns.parentTaskSlug)} text`,
        `${quoteIdentifier(columns.parentTaskID)} text`,
      ]
    : []
  const columnDefinitions = [
    '"_order" integer NOT NULL',
    `"_parent_id" ${parentIDType} NOT NULL`,
    '"id" text PRIMARY KEY NOT NULL',
    '"executed_at" text NOT NULL',
    '"completed_at" text NOT NULL',
    '"task_slug" text NOT NULL',
    '"task_i_d" text NOT NULL',
    `"input" text${inputRequired ? ' NOT NULL' : ''}`,
    '"output" text',
    '"state" text NOT NULL',
    '"error" text',
    ...parentColumns,
    `CONSTRAINT ${quoteIdentifier(metadata.logForeignKeyName)} FOREIGN KEY ("_parent_id") REFERENCES ${quoteIdentifier(jobsTableName)} ("id") ON UPDATE no action ON DELETE cascade`,
  ]
  const columnNames = [
    '_order',
    '_parent_id',
    'id',
    'executed_at',
    'completed_at',
    'task_slug',
    'task_i_d',
    'input',
    'output',
    'state',
    'error',
    ...(includeParent ? [columns.parentTaskSlug, columns.parentTaskID] : []),
  ]
    .map(quoteIdentifier)
    .join(', ')

  return [
    'PRAGMA foreign_keys=OFF',
    `CREATE TABLE ${quoteIdentifier(temporaryTableName)} (\n  ${columnDefinitions.join(',\n  ')}\n)`,
    `INSERT INTO ${quoteIdentifier(temporaryTableName)} (${columnNames}) SELECT ${columnNames} FROM ${quoteIdentifier(logTableName)}`,
    `DROP TABLE ${quoteIdentifier(logTableName)}`,
    `ALTER TABLE ${quoteIdentifier(temporaryTableName)} RENAME TO ${quoteIdentifier(logTableName)}`,
    `CREATE INDEX ${quoteIdentifier(metadata.logOrderIndexName)} ON ${quoteIdentifier(logTableName)} ("_order")`,
    `CREATE INDEX ${quoteIdentifier(metadata.logParentIndexName)} ON ${quoteIdentifier(logTableName)} ("_parent_id")`,
    'PRAGMA foreign_keys=ON',
  ]
}

/**
 * Applies the schema changes made by `migrateJobsV4` to the project's previous snapshot. The next
 * generated migration then starts from the migrated jobs tables and still picks up every other
 * schema change the upgrade brings.
 */
const applyJobsV4ToSnapshot = ({
  current,
  metadata,
  previous,
}: {
  current: Snapshot
  metadata: JobsV4Metadata
  previous: Snapshot
}): Snapshot => {
  const snapshot = structuredClone(previous)
  const getTable = ({ name, source }: { name: string; source: Snapshot }) => {
    const entry = Object.entries(source.tables).find(([, table]) => table.name === name)

    if (!entry) {
      throw new Error(`Could not find the ${name} table in the migration snapshot`)
    }

    return entry
  }
  const [, jobsTable] = getTable({ name: metadata.jobsTableName, source: snapshot })
  const [, logTable] = getTable({ name: metadata.logTableName, source: snapshot })
  const [, currentJobsTable] = getTable({ name: metadata.jobsTableName, source: current })
  const [, currentLogTable] = getTable({ name: metadata.logTableName, source: current })
  const [statsTableKey, currentStatsTable] = getTable({
    name: metadata.statsTableName,
    source: current,
  })
  const { columns } = metadata

  delete jobsTable.columns.processing
  delete jobsTable.indexes[metadata.processingIndexName]

  for (const column of [
    columns.concurrencyKey,
    columns.meta,
    columns.processingToken,
    columns.processingUntil,
  ]) {
    jobsTable.columns[column] = currentJobsTable.columns[column]
  }

  for (const index of [metadata.concurrencyKeyIndexName, metadata.processingUntilIndexName]) {
    jobsTable.indexes[index] = currentJobsTable.indexes[index]
  }

  for (const column of [columns.input, columns.parentTaskID, columns.parentTaskSlug]) {
    logTable.columns[column] = currentLogTable.columns[column]
  }

  snapshot.tables[statsTableKey] = currentStatsTable

  for (const [key, enumType] of Object.entries(current.enums ?? {})) {
    if (enumType.name === metadata.parentTaskSlugEnumName) {
      snapshot.enums = { ...snapshot.enums, [key]: enumType }
    }
  }

  snapshot.prevId = previous.id
  snapshot.id = randomUUID()

  return snapshot
}

export async function migrateJobsV4(args: MigrationArgs): Promise<void> {
  const adapter = args.payload.db as DrizzleAdapter
  const metadata = getJobsV4Metadata(adapter)
  const schemaName = adapter.schemaName || 'public'
  const { columns } = metadata
  const postgresJobsTable = getQualifiedName({
    name: metadata.jobsTableName,
    dialect: 'postgres',
    schemaName,
  })
  const postgresLogTable = getQualifiedName({
    name: metadata.logTableName,
    dialect: 'postgres',
    schemaName,
  })
  const postgresStatsTable = getQualifiedName({
    name: metadata.statsTableName,
    dialect: 'postgres',
    schemaName,
  })
  const parentTaskSlugEnum = getQualifiedName({
    name: metadata.parentTaskSlugEnumName,
    dialect: 'postgres',
    schemaName,
  })
  const parentTaskSlugOptions = metadata.parentTaskSlugOptions.map(quoteLiteral).join(', ')
  const postgresStatsID =
    metadata.idType === 'serial'
      ? 'serial'
      : `uuid${metadata.idType === 'uuid' ? ' DEFAULT gen_random_uuid()' : ''}`

  const upPostgres = [
    /** Add the processing lease fields used to safely claim and renew jobs. */
    `ALTER TABLE ${postgresJobsTable} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columns.processingUntil)} timestamp(3) with time zone`,
    `ALTER TABLE ${postgresJobsTable} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columns.processingToken)} varchar`,
    /** Add the job metadata field that is now always available. */
    `ALTER TABLE ${postgresJobsTable} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columns.meta)} jsonb`,
    /** Add the concurrency key used to limit simultaneously running jobs. */
    `ALTER TABLE ${postgresJobsTable} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columns.concurrencyKey)} varchar`,
    /** Convert actively processing jobs to expired leases so workers can safely reclaim them. */
    `UPDATE ${postgresJobsTable} SET ${quoteIdentifier(columns.processingUntil)} = '1970-01-01T00:00:00.000Z' WHERE "processing" = true AND ${quoteIdentifier(columns.processingUntil)} IS NULL`,
    /** Replace the old processing flag and index with lease and concurrency indexes. */
    `DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(metadata.processingIndexName)}`,
    `ALTER TABLE ${postgresJobsTable} DROP COLUMN "processing"`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(metadata.processingUntilIndexName)} ON ${postgresJobsTable} USING btree (${quoteIdentifier(columns.processingUntil)})`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(metadata.concurrencyKeyIndexName)} ON ${postgresJobsTable} USING btree (${quoteIdentifier(columns.concurrencyKey)})`,
    /** Add parent-task details to every task log entry. */
    `DO $$ BEGIN CREATE TYPE ${parentTaskSlugEnum} AS ENUM (${parentTaskSlugOptions}); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `ALTER TABLE ${postgresLogTable} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columns.parentTaskSlug)} ${parentTaskSlugEnum}`,
    `ALTER TABLE ${postgresLogTable} ADD COLUMN IF NOT EXISTS ${quoteIdentifier(columns.parentTaskID)} varchar`,
    /** Backfill missing task input and make stored task input required. */
    `UPDATE ${postgresLogTable} SET ${quoteIdentifier(columns.input)} = '{}'::jsonb WHERE ${quoteIdentifier(columns.input)} IS NULL`,
    `ALTER TABLE ${postgresLogTable} ALTER COLUMN ${quoteIdentifier(columns.input)} SET NOT NULL`,
    /** Create the job statistics global that is now always enabled. */
    `CREATE TABLE IF NOT EXISTS ${postgresStatsTable} ("id" ${postgresStatsID} PRIMARY KEY NOT NULL, "stats" jsonb, "updated_at" timestamp(3) with time zone, "created_at" timestamp(3) with time zone)`,
  ]
  const downPostgres = [
    /** Allow missing task input again. */
    `ALTER TABLE ${postgresLogTable} ALTER COLUMN ${quoteIdentifier(columns.input)} DROP NOT NULL`,
    /** Remove parent-task details from task log entries. */
    `ALTER TABLE ${postgresLogTable} DROP COLUMN IF EXISTS ${quoteIdentifier(columns.parentTaskID)}`,
    `ALTER TABLE ${postgresLogTable} DROP COLUMN IF EXISTS ${quoteIdentifier(columns.parentTaskSlug)}`,
    `DROP TYPE IF EXISTS ${parentTaskSlugEnum}`,
    /** Remove the always-enabled job statistics global. */
    `DROP TABLE IF EXISTS ${postgresStatsTable}`,
    /** Remove the concurrency and processing lease indexes. */
    `DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(metadata.concurrencyKeyIndexName)}`,
    `DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(metadata.processingUntilIndexName)}`,
    /** Restore the processing flag and mark every leased job as processing. */
    `ALTER TABLE ${postgresJobsTable} ADD COLUMN IF NOT EXISTS "processing" boolean DEFAULT false`,
    `UPDATE ${postgresJobsTable} SET "processing" = true WHERE ${quoteIdentifier(columns.processingUntil)} IS NOT NULL`,
    /** Remove the fields that became managed by Payload in v4. */
    `ALTER TABLE ${postgresJobsTable} DROP COLUMN IF EXISTS ${quoteIdentifier(columns.concurrencyKey)}`,
    `ALTER TABLE ${postgresJobsTable} DROP COLUMN IF EXISTS ${quoteIdentifier(columns.meta)}`,
    `ALTER TABLE ${postgresJobsTable} DROP COLUMN IF EXISTS ${quoteIdentifier(columns.processingToken)}`,
    `ALTER TABLE ${postgresJobsTable} DROP COLUMN IF EXISTS ${quoteIdentifier(columns.processingUntil)}`,
    /** Restore the index for the processing flag. */
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(metadata.processingIndexName)} ON ${postgresJobsTable} USING btree ("processing")`,
  ]

  if (args.dialect === 'postgres') {
    const statements = args.direction === 'up' ? upPostgres : downPostgres

    for (const statement of statements) {
      await args.db.execute(args.sql.raw(statement))
    }

    return
  }

  const sqliteJobsTable = quoteIdentifier(metadata.jobsTableName)
  const sqliteLogTable = quoteIdentifier(metadata.logTableName)
  const sqliteStatsTable = quoteIdentifier(metadata.statsTableName)
  const sqliteStatsID = `${getSQLiteIDType(metadata.statsIDType)} PRIMARY KEY NOT NULL${metadata.statsAutoIncrement ? ' AUTOINCREMENT' : ''}`

  const upSQLite = [
    /** Add the processing lease fields used to safely claim and renew jobs. */
    `ALTER TABLE ${sqliteJobsTable} ADD COLUMN ${quoteIdentifier(columns.processingUntil)} text`,
    `ALTER TABLE ${sqliteJobsTable} ADD COLUMN ${quoteIdentifier(columns.processingToken)} text`,
    /** Add the job metadata field that is now always available. */
    `ALTER TABLE ${sqliteJobsTable} ADD COLUMN ${quoteIdentifier(columns.meta)} text`,
    /** Add the concurrency key used to limit simultaneously running jobs. */
    `ALTER TABLE ${sqliteJobsTable} ADD COLUMN ${quoteIdentifier(columns.concurrencyKey)} text`,
    /** Convert actively processing jobs to expired leases so workers can safely reclaim them. */
    `UPDATE ${sqliteJobsTable} SET ${quoteIdentifier(columns.processingUntil)} = '1970-01-01T00:00:00.000Z' WHERE "processing" = true AND ${quoteIdentifier(columns.processingUntil)} IS NULL`,
    /** Replace the old processing flag and index with lease and concurrency indexes. */
    `DROP INDEX IF EXISTS ${quoteIdentifier(metadata.processingIndexName)}`,
    `ALTER TABLE ${sqliteJobsTable} DROP COLUMN "processing"`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(metadata.processingUntilIndexName)} ON ${sqliteJobsTable} (${quoteIdentifier(columns.processingUntil)})`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(metadata.concurrencyKeyIndexName)} ON ${sqliteJobsTable} (${quoteIdentifier(columns.concurrencyKey)})`,
    /** Add parent-task details to every task log entry. */
    `ALTER TABLE ${sqliteLogTable} ADD COLUMN ${quoteIdentifier(columns.parentTaskSlug)} text`,
    `ALTER TABLE ${sqliteLogTable} ADD COLUMN ${quoteIdentifier(columns.parentTaskID)} text`,
    /** Backfill missing task input before rebuilding the table with required input. */
    `UPDATE ${sqliteLogTable} SET ${quoteIdentifier(columns.input)} = '{}' WHERE ${quoteIdentifier(columns.input)} IS NULL`,
    ...getSQLiteLogTableStatements({
      includeParent: true,
      inputRequired: true,
      metadata,
    }),
    /** Create the job statistics global that is now always enabled. */
    `CREATE TABLE IF NOT EXISTS ${sqliteStatsTable} ("id" ${sqliteStatsID}, "stats" text, "updated_at" text, "created_at" text)`,
  ]
  const downSQLite = [
    /** Remove parent-task details and allow missing task input again. */
    ...getSQLiteLogTableStatements({
      includeParent: false,
      inputRequired: false,
      metadata,
    }),
    /** Remove the always-enabled job statistics global. */
    `DROP TABLE IF EXISTS ${sqliteStatsTable}`,
    /** Remove the concurrency and processing lease indexes. */
    `DROP INDEX IF EXISTS ${quoteIdentifier(metadata.concurrencyKeyIndexName)}`,
    `DROP INDEX IF EXISTS ${quoteIdentifier(metadata.processingUntilIndexName)}`,
    /** Restore the processing flag and mark every leased job as processing. */
    `ALTER TABLE ${sqliteJobsTable} ADD COLUMN "processing" integer DEFAULT false`,
    `UPDATE ${sqliteJobsTable} SET "processing" = true WHERE ${quoteIdentifier(columns.processingUntil)} IS NOT NULL`,
    /** Remove the fields that became managed by Payload in v4. */
    `ALTER TABLE ${sqliteJobsTable} DROP COLUMN ${quoteIdentifier(columns.concurrencyKey)}`,
    `ALTER TABLE ${sqliteJobsTable} DROP COLUMN ${quoteIdentifier(columns.meta)}`,
    `ALTER TABLE ${sqliteJobsTable} DROP COLUMN ${quoteIdentifier(columns.processingToken)}`,
    `ALTER TABLE ${sqliteJobsTable} DROP COLUMN ${quoteIdentifier(columns.processingUntil)}`,
    /** Restore the index for the processing flag. */
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(metadata.processingIndexName)} ON ${sqliteJobsTable} ("processing")`,
  ]
  const statements = args.direction === 'up' ? upSQLite : downSQLite

  for (const statement of statements) {
    try {
      await args.db.run(args.sql.raw(statement))
    } catch (error) {
      /** Preserve fields that users may have enabled before they became v4 defaults. */
      if (args.direction !== 'up' || !isDuplicateColumnError(error)) {
        throw error
      }
    }
  }
}

/**
 * Builds the `jobs-v4` predefined migration for a SQL adapter.
 *
 * It also writes a schema snapshot: the project's previous snapshot with only the jobs changes
 * applied, so the next generated migration still picks up every other schema change the upgrade
 * brings. A project that has only ever used `push` has no previous snapshot, so the current schema
 * is written instead.
 */
export const buildDynamicPredefinedJobsV4Migration = ({
  dialect,
  packageName,
}: {
  dialect: Dialect
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as DrizzleAdapter
    const { generateDrizzleJson } = await adapter.requireDrizzleKit()
    const currentSnapshot = (await generateDrizzleJson(adapter.schema)) as unknown as Snapshot
    const previousSnapshot = await readLatestSnapshot<Snapshot>({ adapter })
    const snapshot = previousSnapshot
      ? applyJobsV4ToSnapshot({
          current: currentSnapshot,
          metadata: getJobsV4Metadata(adapter),
          previous: previousSnapshot,
        })
      : currentSnapshot
    const sharedArgs = `
    db,
    dialect: ${JSON.stringify(dialect)},
    payload,
    sql,`

    writeFileSync(`${filePath}.json`, JSON.stringify(snapshot, null, 2))

    return {
      downSQL: `await migrateJobsV4({${sharedArgs}
    direction: 'down',
  })`,
      imports: `import { migrateJobsV4 } from '${packageName}/migration-utils'`,
      upSQL: `await migrateJobsV4({${sharedArgs}
    direction: 'up',
  })`,
    }
  }
}
