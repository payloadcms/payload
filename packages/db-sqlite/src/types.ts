import type { Client, Config, ResultSet } from '@libsql/client'
import type { extendDrizzleTable, Operators } from '@payloadcms/drizzle'
import type { BuildQueryJoinAliases, DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { DrizzleConfig, Relation, Relations, SQL } from 'drizzle-orm'
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

export type Args = {
  /**
   * Transform the schema after it's built.
   * You can use it to customize the schema with features that aren't supported by Payload.
   * Examples may include: composite indices, generated columns, vectors
   */
  afterSchemaInit?: SQLiteSchemaHook[]
  /**
   * Transform the schema before it's built.
   * You can use it to preserve an existing database schema and if there are any collissions Payload will override them.
   * To generate Drizzle schema from the database, see [Drizzle Kit introspection](https://orm.drizzle.team/kit-docs/commands#introspect--pull)
   */
  beforeSchemaInit?: SQLiteSchemaHook[]
  client: Config
  /**
   * Compatibillity flag for https://github.com/payloadcms/payload/issues/8027 and https://github.com/payloadcms/payload/issues/8402
   * If you're migrating, you can as well run
   * ```sh
   * pnpm payload migrate:create
   * ```
   * And select "rename field" for targeted fields
   * @default false
   */
  disableConvertRadioAndGroupFieldsToSnakeCase?: boolean
  idType?: 'serial' | 'uuid'
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
  transactionOptions?: false | SQLiteTransactionConfig
  versionsSuffix?: string
}

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

export type DropDatabase = (args: { adapter: SQLiteAdapter }) => Promise<void>

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
  | 'insert'
  | 'operators'
  | 'relations'
>

export type SQLiteAdapter = {
  afterSchemaInit: SQLiteSchemaHook[]
  beforeSchemaInit: SQLiteSchemaHook[]
  client: Client
  clientConfig: Args['client']
  countDistinct: CountDistinct
  defaultDrizzleSnapshot: any
  deleteWhere: DeleteWhere
  /**
   * Compatibillity flag for https://github.com/payloadcms/payload/issues/8027 and https://github.com/payloadcms/payload/issues/8402
   * If you're migrating, you can as well run
   * ```sh
   * pnpm payload migrate:create
   * ```
   * And select "rename field" for targeted fields
   */
  disableConvertRadioAndGroupFieldsToSnakeCase?: boolean
  drizzle: LibSQLDatabase
  dropDatabase: DropDatabase
  execute: Execute<unknown>
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  idType: Args['idType']
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
  schemaName?: Args['schemaName']
  tableNameMap: Map<string, string>
  tables: Record<string, GenericTable>
  transactionOptions: SQLiteTransactionConfig
  versionsSuffix?: string
} & SQLiteDrizzleAdapter

export type IDType = 'integer' | 'numeric' | 'text'

export type MigrateUpArgs = {
  payload: Payload
  req: PayloadRequest
}
export type MigrateDownArgs = {
  payload: Payload
  req: PayloadRequest
}

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'idType' | 'logger' | 'migrationDir' | 'pool'>,
      DrizzleAdapter {
    beginTransaction: (options?: SQLiteTransactionConfig) => Promise<null | number | string>
    drizzle: LibSQLDatabase
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
    tableNameMap: Map<string, string>
    transactionOptions: SQLiteTransactionConfig
    versionsSuffix?: string
  }
}
