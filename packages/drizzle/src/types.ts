import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'
import type {
  ColumnBaseConfig,
  ColumnDataType,
  DrizzleConfig,
  ExtractTablesWithRelations,
  Relation,
  Relations,
  SQL,
  TableRelationalConfig,
} from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgTable, PgTransaction } from 'drizzle-orm/pg-core'
import type { SQLiteColumn, SQLiteTable, SQLiteTransaction } from 'drizzle-orm/sqlite-core'
import type { Result } from 'drizzle-orm/sqlite-core/session'
import type { BaseDatabaseAdapter, MigrationTemplateArgs } from 'payload/database'

import type { BuildQueryJoinAliases } from './queries/buildQuery.js'

export { BuildQueryJoinAliases }
import type { ChainedMethods } from './find/chainMethods.js'

export { ChainedMethods }

export type PostgresDB = NodePgDatabase<Record<string, unknown>>

export type SQLiteDB = LibSQLDatabase<
  Record<string, unknown> & Record<string, GenericRelation | GenericTable>
>

export type GenericPgColumn = PgColumn<
  ColumnBaseConfig<ColumnDataType, string>,
  Record<string, unknown>
>

export type GenericColumns<T> = {
  [x: string]: T
}

type GenericPgTable = PgTable<{
  columns: GenericColumns<GenericPgColumn>
  dialect: string
  name: string
  schema: undefined
}>

type GenericSQLiteTable = SQLiteTable<{
  columns: GenericColumns<SQLiteColumn>
  dialect: string
  name: string
  schema: undefined
}>

export type GenericColumn = GenericPgColumn | SQLiteColumn

export type GenericTable = GenericPgTable | GenericSQLiteTable

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type TransactionSQLite = SQLiteTransaction<
  'async',
  Result<'async', unknown>,
  Record<string, unknown>,
  { tsName: TableRelationalConfig }
>
export type TransactionPg = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, unknown>,
  ExtractTablesWithRelations<Record<string, unknown>>
>

export type DrizzleTransaction = TransactionPg | TransactionSQLite

export type DrizzleAdapter = BaseDatabaseAdapter & {
  countDistinct: (args: {
    db: DrizzleTransaction
    joins: BuildQueryJoinAliases
    tableName: string
    where: SQL
  }) => Promise<number>
  defaultDrizzleSnapshot: DrizzleSnapshotJSON
  deleteWhere: (args: { db: DrizzleTransaction; tableName: string; where: SQL }) => Promise<void>
  drizzle: PostgresDB | SQLiteDB
  dropTables: (args: { adapter: DrizzleAdapter }) => Promise<void>
  enums?: Record<string, unknown>
  execute: (args: {
    db?: DrizzleTransaction
    drizzle?: PostgresDB | SQLiteDB
    raw?: string
    sql?: SQL<unknown>
  }) => Promise<{ rows: Record<string, unknown> }>
  features: {
    json?: boolean
  }
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  generateDrizzleJSON: (args: { schema: Record<string, unknown> }) => unknown
  getMigrationTemplate: (args: MigrationTemplateArgs) => string
  // TODO: figure out the type for idType
  idType: unknown
  initializing: Promise<void>
  insert: (args: {
    db: DrizzleTransaction
    onConflictDoUpdate?: unknown
    tableName: string
    values: Record<string, unknown> | Record<string, unknown>[]
  }) => Promise<Record<string, unknown>[]>
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  push: boolean
  rejectInitializing: () => void
  relations: Record<string, GenericRelation>
  relationshipsSuffix?: string
  resolveInitializing: () => void
  schema: Record<string, unknown>
  schemaName?: string
  sessions: {
    [id: string]: {
      db: DrizzleTransaction
      reject: () => Promise<void>
      resolve: () => Promise<void>
    }
  }
  tableNameMap: Map<string, string>
  tables: Record<string, any>
  versionsSuffix?: string
}
