import type { SQL } from 'drizzle-orm'
import type { DynamicMigrationTemplate } from 'payload'

import { writeFileSync } from 'fs'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'

type MigrationArgs = {
  direction: 'down' | 'up'
  newIndexName: string
  oldIndexName: string
  schemaName?: string
  sql: { raw: (statement: string) => SQL }
  tableName: string
} & (
  | {
      db: { execute: (statement: SQL) => unknown }
      dialect: 'postgres'
    }
  | {
      db: { run: (statement: SQL) => unknown }
      dialect: 'sqlite'
    }
)

const quoteIdentifier = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`

const getDefaultIndexName = (name: string): string => {
  const suffix = '_idx'

  return `${name.slice(0, 60 - suffix.length)}${suffix}`
}

export async function migrateJobsProcessingLease(args: MigrationArgs): Promise<void> {
  const { direction, newIndexName, oldIndexName, schemaName = 'public', sql, tableName } = args
  const quotedTableName = quoteIdentifier(tableName)
  const qualifiedTableName = `${quoteIdentifier(schemaName)}.${quotedTableName}`
  const upPostgres = [
    `ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing_until" timestamp(3) with time zone`,
    `ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing_token" varchar`,
    `UPDATE ${qualifiedTableName} SET "processing_until" = '1970-01-01T00:00:00.000Z' WHERE "processing" = true`,
    `DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(oldIndexName)}`,
    `ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing"`,
    `CREATE INDEX ${quoteIdentifier(newIndexName)} ON ${qualifiedTableName} USING btree ("processing_until")`,
  ]
  const downPostgres = [
    `ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing" boolean DEFAULT false`,
    `UPDATE ${qualifiedTableName} SET "processing" = true WHERE "processing_until" IS NOT NULL`,
    `DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(newIndexName)}`,
    `ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing_token"`,
    `ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing_until"`,
    `CREATE INDEX ${quoteIdentifier(oldIndexName)} ON ${qualifiedTableName} USING btree ("processing")`,
  ]
  const upSQLite = [
    `ALTER TABLE ${quotedTableName} ADD COLUMN "processing_until" text`,
    `ALTER TABLE ${quotedTableName} ADD COLUMN "processing_token" text`,
    `UPDATE ${quotedTableName} SET "processing_until" = '1970-01-01T00:00:00.000Z' WHERE "processing" = true`,
    `DROP INDEX IF EXISTS ${quoteIdentifier(oldIndexName)}`,
    `ALTER TABLE ${quotedTableName} DROP COLUMN "processing"`,
    `CREATE INDEX ${quoteIdentifier(newIndexName)} ON ${quotedTableName} ("processing_until")`,
  ]
  const downSQLite = [
    `ALTER TABLE ${quotedTableName} ADD COLUMN "processing" integer DEFAULT false`,
    `UPDATE ${quotedTableName} SET "processing" = true WHERE "processing_until" IS NOT NULL`,
    `DROP INDEX IF EXISTS ${quoteIdentifier(newIndexName)}`,
    `ALTER TABLE ${quotedTableName} DROP COLUMN "processing_token"`,
    `ALTER TABLE ${quotedTableName} DROP COLUMN "processing_until"`,
    `CREATE INDEX ${quoteIdentifier(oldIndexName)} ON ${quotedTableName} ("processing")`,
  ]

  if (args.dialect === 'postgres') {
    const statements = direction === 'up' ? upPostgres : downPostgres

    for (const statement of statements) {
      await args.db.execute(sql.raw(statement))
    }
  } else {
    const statements = direction === 'up' ? upSQLite : downSQLite

    for (const statement of statements) {
      await args.db.run(sql.raw(statement))
    }
  }
}

export const buildDynamicPredefinedJobsProcessingLeaseMigration = ({
  dialect,
  packageName,
}: {
  dialect: 'postgres' | 'sqlite'
  packageName: string
}): DynamicMigrationTemplate => {
  return async ({ filePath, payload }) => {
    const adapter = payload.db as DrizzleAdapter
    const tableName = adapter.tableNameMap.get(toSnakeCase('payload-jobs'))

    if (!tableName) {
      throw new Error('Could not find the payload-jobs database table')
    }

    const newIndexName =
      Object.values(adapter.rawTables[tableName]?.indexes ?? {}).find(
        (index) => index.on === 'processingUntil',
      )?.name ?? getDefaultIndexName(`${tableName}_processing_until`)
    const oldIndexName = getDefaultIndexName(`${tableName}_processing`)
    const drizzleSnapshot = await adapter.requireDrizzleKit().generateDrizzleJson(adapter.schema)
    const sharedArgs = `
    db,
    dialect: ${JSON.stringify(dialect)},
    newIndexName: ${JSON.stringify(newIndexName)},
    oldIndexName: ${JSON.stringify(oldIndexName)},
    schemaName: ${JSON.stringify(adapter.schemaName)},
    sql,
    tableName: ${JSON.stringify(tableName)},`

    writeFileSync(`${filePath}.json`, JSON.stringify(drizzleSnapshot, null, 2))

    return {
      downSQL: `await migrateJobsProcessingLease({${sharedArgs}
    direction: 'down',
  })`,
      imports: `import { migrateJobsProcessingLease } from '${packageName}/migration-utils'`,
      upSQL: `await migrateJobsProcessingLease({${sharedArgs}
    direction: 'up',
  })`,
    }
  }
}
