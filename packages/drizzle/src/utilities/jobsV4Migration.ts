import type { SQL } from 'drizzle-orm'
import type { DynamicMigrationTemplate, Payload } from 'payload'

import { writeFileSync } from 'fs'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, RawTable } from '../types.js'

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
  logParentIndexName: string
  logTableName: string
  parentTaskSlugEnumName: string
  parentTaskSlugOptions: string[]
  processingIndexName: string
  processingUntilIndexName: string
  statsAutoIncrement: boolean
  statsTableName: string
}

const quoteIdentifier = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`

const quoteLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`

const isDuplicateColumnError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes('duplicate column name') || isDuplicateColumnError(error.cause))
  )
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
  const { columns, idType, jobsTableName, logTableName } = metadata
  const temporaryTableName = `__new_${logTableName}`
  const parentIDType = idType === 'serial' ? 'integer' : 'text'
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
  const sqliteStatsID = `${metadata.idType === 'serial' ? 'integer' : 'text'} PRIMARY KEY NOT NULL${metadata.statsAutoIncrement ? ' AUTOINCREMENT' : ''}`

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

export const buildDynamicPredefinedJobsV4Migration = ({
  dialect,
  packageName,
}: {
  dialect: Dialect
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as DrizzleAdapter
    const snapshot = await adapter.requireDrizzleKit().generateDrizzleJson(adapter.schema)
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
