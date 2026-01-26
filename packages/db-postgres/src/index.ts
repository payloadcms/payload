import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { DatabaseAdapterObj, Payload } from 'payload'

import {
  beginTransaction,
  buildCreateMigration,
  commitTransaction,
  count,
  countGlobalVersions,
  countVersions,
  create,
  createBlocksToJsonMigrator,
  createGlobal,
  createGlobalVersion,
  createSchemaGenerator,
  createVersion,
  deleteMany,
  deleteOne,
  deleteVersions,
  destroy,
  find,
  findDistinct,
  findGlobal,
  findGlobalVersions,
  findOne,
  findVersions,
  migrate,
  migrateDown,
  migrateFresh,
  migrateHasChanges,
  migrateRefresh,
  migrateReset,
  migrateStatus,
  operatorMap,
  queryDrafts,
  rollbackTransaction,
  updateGlobal,
  updateGlobalVersion,
  updateJobs,
  updateMany,
  updateOne,
  updateVersion,
  upsert,
} from '@payloadcms/drizzle'
import {
  columnToCodeConverter,
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
import { createDatabaseAdapter, defaultBeginTransaction, findMigrationDir } from 'payload'
import pgDependency from 'pg'
import { fileURLToPath } from 'url'

import type { Args, PostgresAdapter } from './types.js'

import { connect } from './connect.js'

const filename = fileURLToPath(import.meta.url)

export function postgresAdapter(args: Args): DatabaseAdapterObj<PostgresAdapter> {
  const postgresIDType = args.idType || 'serial'
  const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'
  const allowIDOnCreate = args.allowIDOnCreate ?? false

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
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      adapterSchema = { enum: pgEnum, table: pgTable }
    }

    const extensions = (args.extensions ?? []).reduce(
      (acc, name) => {
        acc[name] = true
        return acc
      },
      {} as Record<string, boolean>,
    )

    const sanitizeStatements = ({
      sqlExecute,
      statements,
    }: {
      sqlExecute: string
      statements: string[]
    }): string => {
      return `${sqlExecute}\n ${statements.join('\n')}\`)`
    }

    const executeMethod = 'execute'

    const adapter = createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',
      afterSchemaInit: args.afterSchemaInit ?? [],
      allowIDOnCreate,
      beforeSchemaInit: args.beforeSchemaInit ?? [],
      blocksAsJSON: args.blocksAsJSON ?? false,
      createDatabase,
      createExtensions,
      createMigration: buildCreateMigration({
        executeMethod,
        filename,
        sanitizeStatements,
      }),
      defaultDrizzleSnapshot,
      disableCreateDatabase: args.disableCreateDatabase ?? false,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      drizzle: undefined,
      enums: {},
      extensions,
      features: {
        json: true,
      },
      fieldConstraints: {},
      findDistinct,
      generateSchema: createSchemaGenerator({
        columnToCodeConverter,
        corePackageSuffix: 'pg-core',
        defaultOutputFile: args.generateSchemaOutputFile,
        enumImport: 'pgEnum',
        schemaImport: 'pgSchema',
        tableImport: 'pgTable',
      }),
      idType: postgresIDType,
      initializing,
      localesSuffix: args.localesSuffix || '_locales',
      logger: args.logger,
      migrateHasChanges,
      operators: operatorMap,
      pg: args.pg || pgDependency,
      pgSchema: adapterSchema,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      pool: undefined,
      poolOptions: args.pool,
      prodMigrations: args.prodMigrations,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      push: args.push,
      readReplicaOptions: args.readReplicas,
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
      foreignKeys: new Set(),
      indexes: new Set<string>(),
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
      rawRelations: {},
      rawTables: {},
      updateJobs,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      rejectInitializing,
      requireDrizzleKit,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      resolveInitializing,
      rollbackTransaction,
      updateGlobal,
      updateGlobalVersion,
      updateMany,
      updateOne,
      updateVersion,
      upsert,
    })

    adapter.blocksToJsonMigrator = createBlocksToJsonMigrator({
      adapter: adapter as unknown as DrizzleAdapter,
      executeMethod,
      sanitizeStatements,
    })

    return adapter
  }

  return {
    name: 'postgres',
    allowIDOnCreate,
    defaultIDType: payloadIDType,
    init: adapter,
  }
}

export type {
  Args as PostgresAdapterArgs,
  GeneratedDatabaseSchema,
  PostgresAdapter,
} from './types.js'
export type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/drizzle/postgres'
export { geometryColumn } from '@payloadcms/drizzle/postgres'
export { sql } from 'drizzle-orm'
