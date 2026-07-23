import type { ResultSet } from '@libsql/client'
import type { BuildQueryJoinAliases, DrizzleAdapter, extendDrizzleTable } from '@payloadcms/drizzle'
import type { BaseSQLiteAdapter, BaseSQLiteArgs } from '@payloadcms/drizzle/sqlite'
import type { DrizzleConfig, Relation, Relations, SQL } from 'drizzle-orm'
import type { AnyD1Database, DrizzleD1Database } from 'drizzle-orm/d1'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type {
  AnySQLiteColumn,
  SQLiteInsertOnConflictDoUpdateConfig,
  SQLiteTableWithColumns,
  SQLiteTransactionConfig,
} from 'drizzle-orm/sqlite-core'
import type { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw'
import type { Payload, PayloadRequest } from 'payload'

type SQLiteSchema = {
  relations: Record<string, GenericRelation>
  tables: Record<string, SQLiteTableWithColumns<any>>
}

type SQLiteSchemaHookArgs = {
  extendTable: typeof extendDrizzleTable
  schema: SQLiteSchema
}

export type SQLiteSchemaHook = (args: SQLiteSchemaHookArgs) => Promise<SQLiteSchema> | SQLiteSchema

/**
 * Connect to D1 using the Cloudflare REST API (for example from Vercel or Node).
 * Requires a Cloudflare API token with D1 permissions.
 */
export type HttpConfig = {
  /** Cloudflare account ID */
  accountId: string
  /** Cloudflare API token with D1 access */
  apiToken: string
  /** Override the default `https://api.cloudflare.com/client/v4` base URL (for testing) */
  baseUrl?: string
  /** D1 database ID */
  databaseId: string
}

type WorkerBindingArgs = {
  binding: AnyD1Database
  http?: never
}

type RemoteHttpArgs = {
  binding?: never
  http: HttpConfig
}

export type Args = {
  /**
   * Experimental. Enables read replicas support with the `first-primary` strategy.
   * Not supported with `http` — use a Cloudflare Workers deployment with a D1 binding (not available over the HTTP API).
   *
   * @experimental
   * @example
   *
   * ```readReplicas: 'first-primary'```
   */
  readReplicas?: 'first-primary'
} & BaseSQLiteArgs &
  (RemoteHttpArgs | WorkerBindingArgs)

export type GenericColumns = {
  [x: string]: AnySQLiteColumn
}

export type GenericTable = SQLiteTableWithColumns<{
  columns: GenericColumns
  dialect: string
  name: string
  schema: string
}>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type CountDistinct = (args: {
  db: LibSQLDatabase
  joins: BuildQueryJoinAliases
  tableName: string
  where: SQL
}) => Promise<number>

export type DeleteWhere = (args: {
  db: LibSQLDatabase
  tableName: string
  where: SQL
}) => Promise<void>

export type DropDatabase = (args: { adapter: SQLiteD1Adapter }) => Promise<void>

export type Execute<T> = (args: {
  db?: LibSQLDatabase
  drizzle?: LibSQLDatabase
  raw?: string
  sql?: SQL<unknown>
}) => SQLiteRaw<Promise<T>> | SQLiteRaw<ResultSet>

export type Insert = (args: {
  db: LibSQLDatabase
  onConflictDoUpdate?: SQLiteInsertOnConflictDoUpdateConfig<any>
  tableName: string
  values: Record<string, unknown> | Record<string, unknown>[]
}) => Promise<Record<string, unknown>[]>

// Explicitly omit drizzle property for complete override in SQLiteAdapter, required in ts 5.5
type SQLiteDrizzleAdapter = Omit<
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
  schemaUntyped: Record<string, unknown>
}

type ResolveSchemaType<T> = 'schema' extends keyof T
  ? T['schema']
  : GeneratedDatabaseSchema['schemaUntyped']

type Drizzle = { $client: AnyD1Database } & DrizzleD1Database<Record<string, any>>

export type SQLiteD1Adapter = {
  /** After `connect`, the D1 client in use (Workers binding, session wrapper, or HTTP shim). */
  binding?: AnyD1Database
  client: AnyD1Database
  drizzle: Drizzle
  /** When using HTTP mode, config used to construct the remote D1 client */
  httpConfig?: HttpConfig
  /**
   * Experimental. Enables read replicas support with the `first-primary` strategy.
   * Requires a Cloudflare Workers D1 binding — not available with `http`.
   *
   * @example
   *
   * ```readReplicas: 'first-primary'```
   */
  readReplicas?: 'first-primary'
} & BaseSQLiteAdapter &
  SQLiteDrizzleAdapter

export type IDType = 'integer' | 'numeric' | 'text'

export type MigrateUpArgs = {
  /**
   * The SQLite Drizzle instance that you can use to execute SQL directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateUpArgs, sql } from '@payloadcms/db-sqlite'
   *
   * export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
   *   const { rows: posts } = await db.run(sql`SELECT * FROM posts`)
   * }
   * ```
   */
  db: Drizzle
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateUpArgs } from '@payloadcms/db-sqlite'
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
   * The SQLite Drizzle instance that you can use to execute SQL directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
   *
   * export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
   *   const { rows: posts } = await db.run(sql`SELECT * FROM posts`)
   * }
   * ```
   */
  db: Drizzle
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateDownArgs } from '@payloadcms/db-sqlite'
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

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'idType' | 'logger' | 'migrationDir' | 'pool' | 'prodMigrations'>,
      SQLiteDrizzleAdapter {
    beginTransaction: (options?: SQLiteTransactionConfig) => Promise<null | number | string>
    drizzle: Drizzle
    /**
     * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
     * Used for returning properly formed errors from unique fields
     */
    fieldConstraints: Record<string, Record<string, string>>
    idType: Args['idType']
    initializing: Promise<void>
    localesSuffix?: string
    logger: DrizzleConfig['logger']
    prodMigrations?: {
      down: (args: MigrateDownArgs) => Promise<void>
      name: string
      up: (args: MigrateUpArgs) => Promise<void>
    }[]
    push: boolean
    rejectInitializing: () => void
    relationshipsSuffix?: string
    resolveInitializing: () => void
    schema: Record<string, GenericRelation | GenericTable>
    sessions: DrizzleAdapter['sessions']
    tableNameMap: Map<string, string>
    transactionOptions: SQLiteTransactionConfig
    versionsSuffix?: string
  }
}
