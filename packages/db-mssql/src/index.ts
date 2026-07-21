import type { DrizzleAdapter, Operators } from '@payloadcms/drizzle'
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
  convertPathToJSONTraversal,
  countDistinct,
  createJSONQuery,
  defaultDrizzleSnapshot,
  deleteWhere,
  dropDatabase,
  execute,
  init,
  insert,
  requireDrizzleKit,
} from '@payloadcms/drizzle/mssql'
import { like, notLike } from 'drizzle-orm'
import { createDatabaseAdapter, defaultBeginTransaction, findMigrationDir } from 'payload'
import { fileURLToPath } from 'url'

import type { Args, MSSQLAdapter } from './types.js'

import { connect } from './connect.js'

const filename = fileURLToPath(import.meta.url)

export function mssqlAdapter(args: Args): DatabaseAdapterObj<MSSQLAdapter> {
  const mssqlIDType = args.idType || 'number'
  const payloadIDType = mssqlIDType === 'uuid' || mssqlIDType === 'uuidv7' ? 'text' : 'number'
  const allowIDOnCreate = args.allowIDOnCreate ?? false

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)
    let resolveInitializing: () => void = () => {}
    let rejectInitializing: () => void = () => {}

    const initializing = new Promise<void>((res, rej) => {
      resolveInitializing = res
      rejectInitializing = rej
    })

    // SQL Server's default collation is case-insensitive, so plain LIKE already behaves like
    // Payload's case-insensitive `contains`; we override the operators to avoid ilike (Postgres).
    const operators = {
      ...operatorMap,
      contains: like,
      like,
      not_like: notLike,
    } as unknown as Operators

    const executeMethod = 'execute'
    const sanitizeStatements = ({
      sqlExecute,
      statements,
    }: {
      sqlExecute: string
      statements: string[]
    }) => {
      return statements
        .map((statement) => `${sqlExecute}${statement?.replaceAll('`', '\\`')}\`)`)
        .join('\n')
    }

    const adapter = createDatabaseAdapter<MSSQLAdapter>({
      name: 'mssql',
      afterSchemaInit: args.afterSchemaInit ?? [],
      allowIDOnCreate,
      beforeSchemaInit: args.beforeSchemaInit ?? [],
      blocksAsJSON: args.blocksAsJSON ?? false,
      clientConfig: args.pool,
      defaultDrizzleSnapshot,
      disableCreateDatabase: args.disableCreateDatabase ?? false,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      drizzle: undefined,
      features: {
        json: true,
      },
      fieldConstraints: {},
      findDistinct,
      generateSchema: createSchemaGenerator({
        columnToCodeConverter,
        corePackageSuffix: 'mssql-core',
        defaultOutputFile: args.generateSchemaOutputFile,
        tableImport: 'mssqlTable',
      }),
      idType: mssqlIDType,
      initializing,
      // SQL Server caps a single statement at 2100 bound parameters, so batch large inserts.
      limitedBoundParameters: true,
      localesSuffix: args.localesSuffix || '_locales',
      logger: args.logger,
      operators,
      prodMigrations: args.prodMigrations,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
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
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      transactionOptions: args.transactionOptions || undefined,
      updateJobs,
      updateMany,
      versionsSuffix: args.versionsSuffix || '_v',
      // DatabaseAdapter
      beginTransaction: args.transactionOptions ? beginTransaction : defaultBeginTransaction(),
      // @ts-expect-error - client is assigned on connect
      client: undefined,
      commitTransaction,
      connect,
      convertPathToJSONTraversal,
      count,
      countDistinct,
      countGlobalVersions,
      countVersions,
      create,
      createGlobal,
      createGlobalVersion,
      createJSONQuery,
      createMigration: buildCreateMigration({
        executeMethod,
        filename,
        sanitizeStatements,
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
      packageName: '@payloadcms/db-mssql',
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
    name: 'mssql',
    allowIDOnCreate,
    defaultIDType: payloadIDType,
    init: adapter,
  }
}

export type {
  Args as MSSQLAdapterArgs,
  CountDistinct,
  DeleteWhere,
  DropDatabase,
  Execute,
  GeneratedDatabaseSchema,
  GenericColumns,
  GenericRelation,
  GenericTable,
  IDType,
  Insert,
  MigrateDownArgs,
  MigrateUpArgs,
  MSSQLAdapter,
  MSSQLSchemaHook,
} from './types.js'

export { sql } from 'drizzle-orm'
