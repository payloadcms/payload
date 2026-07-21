import type {
  BuildQueryJoinAliases,
  DrizzleAdapter,
  extendDrizzleTable,
  Operators,
} from '@payloadcms/drizzle'
import type {
  BaseMSSQLAdapter,
  BaseMSSQLArgs,
  OnConflictDoUpdateConfig,
} from '@payloadcms/drizzle/mssql'
import type { AnyRelations, DrizzleConfig, SQL, TableRelationalConfig } from 'drizzle-orm'
import type {
  AnyMsSqlColumn,
  MsSqlColumn,
  MsSqlTableWithColumns,
  MsSqlTransactionConfig,
} from 'drizzle-orm/mssql-core'
import type { NodeMsSqlDatabase } from 'drizzle-orm/node-mssql'
import type { ConnectionPool, config as MsSqlConfig } from 'mssql'
import type { Payload, PayloadRequest } from 'payload'

type MSSQLSchema = {
  relations: Record<string, GenericRelation>
  tables: Record<string, MsSqlTableWithColumns<any>>
}

type MSSQLSchemaHookArgs = {
  extendTable: typeof extendDrizzleTable
  schema: MSSQLSchema
}

export type MSSQLSchemaHook = (args: MSSQLSchemaHookArgs) => MSSQLSchema | Promise<MSSQLSchema>

/**
 * SQL Server connection configuration. Either provide a `connectionString`
 * (`sqlserver://host:port;database=...;user=...;password=...`) or the individual `mssql`
 * connection options.
 */
export type MSSQLPoolOptions = { connectionString?: string } & Partial<MsSqlConfig>

export type Args = {
  pool: MSSQLPoolOptions
} & BaseMSSQLArgs

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

export type DropDatabase = (args: { adapter: MSSQLAdapter }) => Promise<void>

export type Execute<T> = (args: {
  db?: NodeMsSqlDatabase
  drizzle?: NodeMsSqlDatabase
  raw?: string
  sql?: SQL<unknown>
}) => Promise<T>

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

export type MSSQLAdapter = {
  clientConfig: Args['pool']
  drizzle: Drizzle
} & BaseMSSQLAdapter &
  MSSQLDrizzleAdapter

export type IDType = 'integer' | 'numeric' | 'text'

export type MigrateUpArgs = {
  db: Drizzle
  payload: Payload
  req: PayloadRequest
}
export type MigrateDownArgs = {
  db: Drizzle
  payload: Payload
  req: PayloadRequest
}

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'idType' | 'logger' | 'migrationDir' | 'pool' | 'prodMigrations'>,
      MSSQLDrizzleAdapter {
    beginTransaction: (options?: Partial<MsSqlTransactionConfig>) => Promise<null | number | string>
    client: ConnectionPool
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
    transactionOptions: MsSqlTransactionConfig
    versionsSuffix?: string
  }
}
