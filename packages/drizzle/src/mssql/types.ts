import type { AnyRelations, DrizzleConfig, SQL, TableRelationalConfig } from 'drizzle-orm'
import type {
  AnyMsSqlColumn,
  MsSqlColumn,
  MsSqlTableWithColumns,
  MsSqlTransactionConfig,
} from 'drizzle-orm/mssql-core'
import type { NodeMsSqlDatabase } from 'drizzle-orm/node-mssql'
import type { ConnectionPool } from 'mssql'
import type { Payload, PayloadRequest } from 'payload'

import type { Operators } from '../queries/operatorMap.js'
import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js'
import type { extendDrizzleTable } from '../utilities/extendDrizzleTable.js'

type MSSQLSchema = {
  relations: Record<string, GenericRelation>
  tables: Record<string, MsSqlTableWithColumns<any>>
}

type MSSQLSchemaHookArgs = {
  extendTable: typeof extendDrizzleTable
  schema: MSSQLSchema
}

export type MSSQLSchemaHook = (args: MSSQLSchemaHookArgs) => MSSQLSchema | Promise<MSSQLSchema>

export type BaseMSSQLArgs = {
  /**
   * Transform the schema after it's built.
   * You can use it to customize the schema with features that aren't supported by Payload.
   * Examples may include: composite indices, generated columns, vectors
   */
  afterSchemaInit?: MSSQLSchemaHook[]
  /**
   * Enable this flag if you want to thread your own ID to create operation data, for example:
   * ```ts
   * // doc created with id 1
   * const doc = await payload.create({ collection: 'posts', data: {id: 1, title: "my title"}})
   * ```
   */
  allowIDOnCreate?: boolean
  /**
   * Transform the schema before it's built.
   * You can use it to preserve an existing database schema and if there are any collissions Payload will override them.
   * To generate Drizzle schema from the database, see [Drizzle Kit introspection](https://orm.drizzle.team/kit-docs/commands#introspect--pull)
   */
  beforeSchemaInit?: MSSQLSchemaHook[]
  /**
   * Store blocks as JSON column instead of storing them in a relational structure.
   */
  blocksAsJSON?: boolean
  /**
   * By default, Payload will create the database if it does not exist. Set this to `true` to disable
   * that behavior — useful if the connecting user lacks `CREATE DATABASE` privileges.
   */
  disableCreateDatabase?: boolean
  /** Generated schema from payload generate:db-schema file path */
  generateSchemaOutputFile?: string
  idType?: 'number' | 'uuid' | 'uuidv7'
  localesSuffix?: string
  logger?: DrizzleConfig['logger']
  migrationDir?: string
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>
    name: string
    up: (args: MigrateUpArgs) => Promise<void>
  }[]
  push?: boolean
  relationshipsSuffix?: string
  schemaName?: string
  transactionOptions?: false | MsSqlTransactionConfig
  versionsSuffix?: string
}

export type GenericColumns = {
  [x: string]: AnyMsSqlColumn
}

export type GenericTable = MsSqlTableWithColumns<{
  columns: GenericColumns
  dialect: string
  name: string
  schema: string
}>

export type GenericRelation = TableRelationalConfig

export type CountDistinct = (args: {
  column?: MsSqlColumn<any>
  db: NodeMsSqlDatabase
  joins: BuildQueryJoinAliases
  tableName: string
  where: SQL
}) => Promise<number>

export type DeleteWhere = (args: {
  db: NodeMsSqlDatabase
  tableName: string
  where: SQL
}) => Promise<void>

export type DropDatabase = (args: { adapter: BaseMSSQLAdapter }) => Promise<void>

export type Execute<T> = (args: {
  db?: NodeMsSqlDatabase
  drizzle?: NodeMsSqlDatabase
  raw?: string
  sql?: SQL<unknown>
}) => Promise<T>

/**
 * Emulated conflict-resolution config. MSSQL has no native `ON CONFLICT` clause, so the mssql
 * `insert` implementation translates this into a `MERGE` statement.
 */
export type OnConflictDoUpdateConfig = {
  set: Record<string, unknown>
  /** Columns that make up the unique/conflict target. */
  target: MsSqlColumn | MsSqlColumn[]
  targetWhere?: SQL
}

export type Insert = (args: {
  db: NodeMsSqlDatabase
  onConflictDoUpdate?: OnConflictDoUpdateConfig
  tableName: string
  values: Record<string, unknown> | Record<string, unknown>[]
}) => Promise<Record<string, unknown>[]>

// Explicitly omit drizzle property for complete override in MSSQLAdapter, required in ts 5.5
type MSSQLDrizzleAdapter = Omit<
  DrizzleAdapter,
  | 'countDistinct'
  | 'deleteWhere'
  | 'drizzle'
  | 'dropDatabase'
  | 'execute'
  | 'idType'
  | 'insert'
  | 'operators'
  | 'relations'
>

export interface GeneratedDatabaseSchema {
  schemaUntyped: AnyRelations
}

type ResolveSchemaType<T> = 'schema' extends keyof T
  ? T['schema']
  : GeneratedDatabaseSchema['schemaUntyped']

type Drizzle = { $client: ConnectionPool } & NodeMsSqlDatabase<
  ResolveSchemaType<GeneratedDatabaseSchema>
>

export type BaseMSSQLAdapter = {
  afterSchemaInit: MSSQLSchemaHook[]
  beforeSchemaInit: MSSQLSchemaHook[]
  client: ConnectionPool
  countDistinct: CountDistinct
  defaultDrizzleSnapshot: any
  deleteWhere: DeleteWhere
  disableCreateDatabase: boolean
  dropDatabase: DropDatabase
  execute: Execute<unknown>
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  idType: BaseMSSQLArgs['idType']
  initializing: Promise<void>
  insert: Insert
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  operators: Operators
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>
    name: string
    up: (args: MigrateUpArgs) => Promise<void>
  }[]
  push: boolean
  rejectInitializing: () => void
  relations: Record<string, GenericRelation>
  relationshipsSuffix?: string
  resolveInitializing: () => void
  schema: Record<string, GenericRelation | GenericTable>
  schemaName?: BaseMSSQLArgs['schemaName']
  tableNameMap: Map<string, string>
  tables: Record<string, GenericTable>
  transactionOptions: MsSqlTransactionConfig
  versionsSuffix?: string
} & MSSQLDrizzleAdapter

export type IDType = 'integer' | 'numeric' | 'text'

export type MigrateUpArgs = {
  /**
   * The SQL Server Drizzle instance that you can use to execute SQL directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateUpArgs, sql } from '@payloadcms/db-mssql'
   *
   * export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
   *   const posts = await db.execute(sql`SELECT * FROM posts`)
   * }
   * ```
   */
  db: Drizzle
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateUpArgs } from '@payloadcms/db-mssql'
   *
   * export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
   *   const posts = await payload.find({ collection: 'posts', req })
   * }
   * ```
   */
  payload: Payload
  /**
   * The `PayloadRequest` object that contains the current transaction
   */
  req: PayloadRequest
}
export type MigrateDownArgs = {
  /**
   * The SQL Server Drizzle instance that you can use to execute SQL directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateDownArgs, sql } from '@payloadcms/db-mssql'
   *
   * export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
   *   const posts = await db.execute(sql`SELECT * FROM posts`)
   * }
   * ```
   */
  db: Drizzle
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateDownArgs } from '@payloadcms/db-mssql'
   *
   * export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
   *   const posts = await payload.find({ collection: 'posts', req })
   * }
   * ```
   */
  payload: Payload
  /**
   * The `PayloadRequest` object that contains the current transaction
   */
  req: PayloadRequest
}
