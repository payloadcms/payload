import type { DynamicMigrationTemplate } from 'payload'

import { writeFileSync } from 'fs'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'

const quoteIdentifier = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`

const getDefaultIndexName = (name: string): string => {
  const suffix = '_idx'

  return `${name.slice(0, 60 - suffix.length)}${suffix}`
}

export const buildDynamicPredefinedJobsProcessingLeaseMigration = ({
  dialect,
}: {
  dialect: 'postgres' | 'sqlite'
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
    const quotedTableName = quoteIdentifier(tableName)
    const schemaName = adapter.schemaName ?? 'public'
    const qualifiedTableName = `${quoteIdentifier(schemaName)}.${quotedTableName}`
    const upPostgres = `
await db.execute(sql.raw(${JSON.stringify(`ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing_until" timestamp(3) with time zone`)}))
await db.execute(sql.raw(${JSON.stringify(`ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing_token" varchar`)}))
await db.execute(sql.raw(${JSON.stringify(`UPDATE ${qualifiedTableName} SET "processing_until" = '1970-01-01T00:00:00.000Z' WHERE "processing" = true`)}))
await db.execute(sql.raw(${JSON.stringify(`DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(oldIndexName)}`)}))
await db.execute(sql.raw(${JSON.stringify(`ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing"`)}))
await db.execute(sql.raw(${JSON.stringify(`CREATE INDEX ${quoteIdentifier(newIndexName)} ON ${qualifiedTableName} USING btree ("processing_until")`)}))`
    const downPostgres = `
await db.execute(sql.raw(${JSON.stringify(`ALTER TABLE ${qualifiedTableName} ADD COLUMN "processing" boolean DEFAULT false`)}))
await db.execute(sql.raw(${JSON.stringify(`UPDATE ${qualifiedTableName} SET "processing" = true WHERE "processing_until" IS NOT NULL`)}))
await db.execute(sql.raw(${JSON.stringify(`DROP INDEX IF EXISTS ${quoteIdentifier(schemaName)}.${quoteIdentifier(newIndexName)}`)}))
await db.execute(sql.raw(${JSON.stringify(`ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing_token"`)}))
await db.execute(sql.raw(${JSON.stringify(`ALTER TABLE ${qualifiedTableName} DROP COLUMN "processing_until"`)}))
await db.execute(sql.raw(${JSON.stringify(`CREATE INDEX ${quoteIdentifier(oldIndexName)} ON ${qualifiedTableName} USING btree ("processing")`)}))`
    const upSQLite = `
await db.run(sql.raw(${JSON.stringify(`ALTER TABLE ${quotedTableName} ADD COLUMN "processing_until" text`)}))
await db.run(sql.raw(${JSON.stringify(`ALTER TABLE ${quotedTableName} ADD COLUMN "processing_token" text`)}))
await db.run(sql.raw(${JSON.stringify(`UPDATE ${quotedTableName} SET "processing_until" = '1970-01-01T00:00:00.000Z' WHERE "processing" = true`)}))
await db.run(sql.raw(${JSON.stringify(`DROP INDEX IF EXISTS ${quoteIdentifier(oldIndexName)}`)}))
await db.run(sql.raw(${JSON.stringify(`ALTER TABLE ${quotedTableName} DROP COLUMN "processing"`)}))
await db.run(sql.raw(${JSON.stringify(`CREATE INDEX ${quoteIdentifier(newIndexName)} ON ${quotedTableName} ("processing_until")`)}))`
    const downSQLite = `
await db.run(sql.raw(${JSON.stringify(`ALTER TABLE ${quotedTableName} ADD COLUMN "processing" integer DEFAULT false`)}))
await db.run(sql.raw(${JSON.stringify(`UPDATE ${quotedTableName} SET "processing" = true WHERE "processing_until" IS NOT NULL`)}))
await db.run(sql.raw(${JSON.stringify(`DROP INDEX IF EXISTS ${quoteIdentifier(newIndexName)}`)}))
await db.run(sql.raw(${JSON.stringify(`ALTER TABLE ${quotedTableName} DROP COLUMN "processing_token"`)}))
await db.run(sql.raw(${JSON.stringify(`ALTER TABLE ${quotedTableName} DROP COLUMN "processing_until"`)}))
await db.run(sql.raw(${JSON.stringify(`CREATE INDEX ${quoteIdentifier(oldIndexName)} ON ${quotedTableName} ("processing")`)}))`
    const drizzleSnapshot = await adapter.requireDrizzleKit().generateDrizzleJson(adapter.schema)

    writeFileSync(`${filePath}.json`, JSON.stringify(drizzleSnapshot, null, 2))

    return dialect === 'postgres'
      ? { downSQL: downPostgres, upSQL: upPostgres }
      : { downSQL: downSQLite, upSQL: upSQLite }
  }
}
