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
import type {
  BaseDatabaseAdapter,
  MigrationData,
  MigrationTemplateArgs,
  Payload,
  PayloadRequest,
} from 'payload'

import type { BuildQueryJoinAliases } from './queries/buildQuery.js'

export { BuildQueryJoinAliases }

import type { ResultSet } from '@libsql/client'
import type { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw'
import type { QueryResult } from 'pg'

import type { ChainedMethods } from './find/chainMethods.js'
import type { Operators } from './queries/operatorMap.js'

export { ChainedMethods }

export type PostgresDB = NodePgDatabase<Record<string, unknown>>

export type SQLiteDB = LibSQLDatabase<
  Record<string, GenericRelation | GenericTable> & Record<string, unknown>
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

export type CountDistinct = (args: {
  db: DrizzleTransaction | LibSQLDatabase | PostgresDB
  joins: BuildQueryJoinAliases
  tableName: string
  where: SQL
}) => Promise<number>

export type DeleteWhere = (args: {
  db: DrizzleTransaction | LibSQLDatabase | PostgresDB
  tableName: string
  where: SQL
}) => Promise<void>

export type DropDatabase = (args: { adapter: DrizzleAdapter }) => Promise<void>

export type Execute<T> = (args: {
  db?: DrizzleTransaction | LibSQLDatabase | PostgresDB
  drizzle?: LibSQLDatabase | PostgresDB
  raw?: string
  sql?: SQL<unknown>
}) =>
  | Promise<QueryResult<Record<string, T>>>
  | SQLiteRaw<Promise<{ rows: T[] }>>
  | SQLiteRaw<ResultSet>

export type Insert = (args: {
  db: DrizzleTransaction | LibSQLDatabase | PostgresDB
  onConflictDoUpdate?: unknown
  tableName: string
  values: Record<string, unknown> | Record<string, unknown>[]
}) => Promise<Record<string, unknown>[]>

export type RequireDrizzleKit = () => {
  generateDrizzleJson: (args: { schema: Record<string, unknown> }) => unknown
  pushSchema: (
    schema: Record<string, unknown>,
    drizzle: DrizzleAdapter['drizzle'],
    filterSchema?: string[],
  ) => Promise<{ apply; hasDataLoss; warnings }>
}

export type Migration = {
  down: ({
    db,
    payload,
    req,
  }: {
    db?: DrizzleTransaction | LibSQLDatabase<Record<string, never>> | PostgresDB
    payload: Payload
    req: PayloadRequest
  }) => Promise<void>
  up: ({
    db,
    payload,
    req,
  }: {
    db?: DrizzleTransaction | LibSQLDatabase | PostgresDB
    payload: Payload
    req: PayloadRequest
  }) => Promise<void>
} & MigrationData

export type CreateJSONQueryArgs = {
  operator: string
  pathSegments: string[]
  table?: string
  treatAsArray?: string[]
  treatRootAsArray?: boolean
  value: boolean | number | string
}

export interface DrizzleAdapter extends BaseDatabaseAdapter {
  convertPathToJSONTraversal: (incomingSegments: string[]) => string
  countDistinct: CountDistinct
  createJSONQuery: (args: CreateJSONQueryArgs) => string
  defaultDrizzleSnapshot: Record<string, unknown>
  deleteWhere: DeleteWhere
  drizzle: LibSQLDatabase | PostgresDB
  dropDatabase: DropDatabase
  enums?: Record<string, unknown> | never
  execute: Execute<unknown>
  features: {
    json?: boolean
  }
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  getMigrationTemplate: (args: MigrationTemplateArgs) => string
  idType: 'serial' | 'uuid'
  initializing: Promise<void>
  insert: Insert
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  operators: Operators
  push: boolean
  rejectInitializing: () => void
  relations: Record<string, GenericRelation>
  relationshipsSuffix?: string
  requireDrizzleKit: RequireDrizzleKit
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
  transactionOptions: unknown
  versionsSuffix?: string
}
