import type { DatabaseAdapterObj, Payload } from 'payload'

import {
  beginTransaction,
  buildCreateMigration,
  commitTransaction,
  count,
  countGlobalVersions,
  countVersions,
  create,
  createGlobal,
  createGlobalVersion,
  createVersion,
  deleteMany,
  deleteOne,
  deleteVersions,
  destroy,
  find,
  findGlobal,
  findGlobalVersions,
  findMigrationDir,
  findOne,
  findVersions,
  migrate,
  migrateDown,
  migrateFresh,
  migrateRefresh,
  migrateReset,
  migrateStatus,
  operatorMap,
  queryDrafts,
  rollbackTransaction,
  updateGlobal,
  updateGlobalVersion,
  updateOne,
  updateVersion,
} from '@payloadcms/drizzle'
import {
  countDistinct,
  createDatabase,
  createExtensions,
  createJSONQuery,
  defaultDrizzleSnapshot,
  deleteWhere,
  dropDatabase,
  execute,
  init,
  insert,
  requireDrizzleKit,
} from '@payloadcms/drizzle/postgres'
import { pgEnum, pgSchema, pgTable } from 'drizzle-orm/pg-core'
import { createDatabaseAdapter, defaultBeginTransaction } from 'payload'
import { fileURLToPath } from 'url'

import type { Args, VercelPostgresAdapter } from './types.js'

import { connect } from './connect.js'

const filename = fileURLToPath(import.meta.url)

export function vercelPostgresAdapter(args: Args = {}): DatabaseAdapterObj<VercelPostgresAdapter> {
  const postgresIDType = args.idType || 'serial'
  const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)
    let resolveInitializing
    let rejectInitializing
    let adapterSchema: VercelPostgresAdapter['pgSchema']

    const initializing = new Promise<void>((res, rej) => {
      resolveInitializing = res
      rejectInitializing = rej
    })

    if (args.schemaName) {
      adapterSchema = pgSchema(args.schemaName)
    } else {
      adapterSchema = { enum: pgEnum, table: pgTable }
    }

    const extensions = (args.extensions ?? []).reduce((acc, name) => {
      acc[name] = true
      return acc
    }, {})

    return createDatabaseAdapter<VercelPostgresAdapter>({
      name: 'postgres',
      afterSchemaInit: args.afterSchemaInit ?? [],
      beforeSchemaInit: args.beforeSchemaInit ?? [],
      createDatabase,
      createExtensions,
      defaultDrizzleSnapshot,
      disableCreateDatabase: args.disableCreateDatabase ?? false,
      drizzle: undefined,
      enums: {},
      extensions,
      features: {
        json: true,
      },
      fieldConstraints: {},
      idType: postgresIDType,
      indexes: new Set<string>(),
      initializing,
      localesSuffix: args.localesSuffix || '_locales',
      logger: args.logger,
      operators: operatorMap,
      pgSchema: adapterSchema,
      pool: undefined,
      poolOptions: args.pool,
      prodMigrations: args.prodMigrations,
      push: args.push,
      rawRelations: {},
      rawTables: {},
      relations: {},
      relationshipsSuffix: args.relationshipsSuffix || '_rels',
      schema: {},
      schemaName: args.schemaName,
      sessions: {},
      tableNameMap: new Map<string, string>(),
      tables: {},
      tablesFilter: args.tablesFilter,
      transactionOptions: args.transactionOptions || undefined,
      versionsSuffix: args.versionsSuffix || '_v',

      // DatabaseAdapter
      beginTransaction:
        args.transactionOptions === false ? defaultBeginTransaction() : beginTransaction,
      commitTransaction,
      connect,
      count,
      countDistinct,
      countGlobalVersions,
      countVersions,
      create,
      createGlobal,
      createGlobalVersion,
      createJSONQuery,
      createMigration: buildCreateMigration({
        executeMethod: 'execute',
        filename,
        sanitizeStatements({ sqlExecute, statements }) {
          return `${sqlExecute}\n ${statements.join('\n')}\`)`
        },
      }),
      createVersion,
      defaultIDType: payloadIDType,
      deleteMany,
      deleteOne,
      deleteVersions,
      deleteWhere,
      destroy,
      dropDatabase,
      execute,
      find,
      findGlobal,
      findGlobalVersions,
      findOne,
      findVersions,
      init,
      insert,
      migrate,
      migrateDown,
      migrateFresh,
      migrateRefresh,
      migrateReset,
      migrateStatus,
      migrationDir,
      packageName: '@payloadcms/db-vercel-postgres',
      payload,
      queryDrafts,
      rejectInitializing,
      requireDrizzleKit,
      resolveInitializing,
      rollbackTransaction,
      updateGlobal,
      updateGlobalVersion,
      updateOne,
      updateVersion,
      upsert: updateOne,
    })
  }

  return {
    defaultIDType: payloadIDType,
    init: adapter,
  }
}

export type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/drizzle/postgres'
export { sql } from 'drizzle-orm'
