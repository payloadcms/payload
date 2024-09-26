import type { DatabaseAdapterObj, Payload } from 'payload'

import {
  beginTransaction,
  commitTransaction,
  count,
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
  convertPathToJSONTraversal,
  countDistinct,
  createJSONQuery,
  createMigration,
  defaultDrizzleSnapshot,
  deleteWhere,
  dropDatabase,
  execute,
  getMigrationTemplate,
  init,
  insert,
  requireDrizzleKit,
} from '@payloadcms/drizzle/postgres'
import { pgEnum, pgSchema, pgTable } from 'drizzle-orm/pg-core'
import { createDatabaseAdapter } from 'payload'

import type { Args, PostgresAdapter } from './types.js'

import { connect } from './connect.js'

export function postgresAdapter(args: Args): DatabaseAdapterObj<PostgresAdapter> {
  const postgresIDType = args.idType || 'serial'
  const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)
    let resolveInitializing
    let rejectInitializing
    let adapterSchema: PostgresAdapter['pgSchema']

    const initializing = new Promise<void>((res, rej) => {
      resolveInitializing = res
      rejectInitializing = rej
    })

    if (args.schemaName) {
      adapterSchema = pgSchema(args.schemaName)
    } else {
      adapterSchema = { enum: pgEnum, table: pgTable }
    }

    return createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',
      afterSchemaInit: args.afterSchemaInit ?? [],
      beforeSchemaInit: args.beforeSchemaInit ?? [],
      defaultDrizzleSnapshot,
      disableConvertRadioAndGroupFieldsToSnakeCase:
        args.disableConvertRadioAndGroupFieldsToSnakeCase ?? false,
      drizzle: undefined,
      enums: {},
      features: {
        json: true,
      },
      fieldConstraints: {},
      getMigrationTemplate,
      idType: postgresIDType,
      initializing,
      localesSuffix: args.localesSuffix || '_locales',
      logger: args.logger,
      operators: operatorMap,
      pgSchema: adapterSchema,
      pool: undefined,
      poolOptions: args.pool,
      prodMigrations: args.prodMigrations,
      push: args.push,
      relations: {},
      relationshipsSuffix: args.relationshipsSuffix || '_rels',
      schema: {},
      schemaName: args.schemaName,
      sessions: {},
      tableNameMap: new Map<string, string>(),
      tables: {},
      transactionOptions: args.transactionOptions || undefined,
      versionsSuffix: args.versionsSuffix || '_v',

      // DatabaseAdapter
      beginTransaction: args.transactionOptions === false ? undefined : beginTransaction,
      commitTransaction,
      connect,
      convertPathToJSONTraversal,
      count,
      countDistinct,
      create,
      createGlobal,
      createGlobalVersion,
      createJSONQuery,
      createMigration,
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
      packageName: '@payloadcms/db-postgres',
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
