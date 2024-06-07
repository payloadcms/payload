import type { Client, Config, ResultSet } from '@libsql/client'
import type {
  BuildQueryJoinAliases,
  DrizzleAdapter,
  SQLiteDB,
  TransactionSQLite,
} from '@payloadcms/drizzle/types'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type {
  SQLiteColumn,
  SQLiteInsertOnConflictDoUpdateConfig,
  SQLiteTableWithColumns,
} from 'drizzle-orm/sqlite-core'
import type { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw'
import type { Payload } from 'payload'
import type { PayloadRequestWithData } from 'payload/types'

import {
  type ColumnDataType,
  type DrizzleConfig,
  type Relation,
  type Relations,
  type SQL,
} from 'drizzle-orm'

export type Args = {
  client: Config
  idType?: 'serial' | 'uuid'
  localesSuffix?: string
  logger?: DrizzleConfig['logger']
  migrationDir?: string
  push?: boolean
  relationshipsSuffix?: string
  schemaName?: string
  versionsSuffix?: string
}

export type GenericColumn = SQLiteColumn<
  {
    baseColumn: never
    columnType: string
    data: unknown
    dataType: ColumnDataType
    driverParam: unknown
    enumValues: string[]
    hasDefault: false
    name: string
    notNull: false
    tableName: string
  },
  object
>

export type GenericColumns = {
  [x: string]: GenericColumn
}

export type GenericTable = SQLiteTableWithColumns<{
  columns: GenericColumns
  dialect: string
  name: string
  schema: string
}>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type CountDistinct = (args: {
  db: TransactionSQLite
  joins: BuildQueryJoinAliases
  tableName: string
  where: SQL
}) => Promise<number>

export type DeleteWhere = (args: {
  db: SQLiteDB | TransactionSQLite
  tableName: string
  where: SQL
}) => Promise<void>

export type DropTables = (args: { adapter: SQLiteAdapter }) => Promise<void>

export type Execute = (args: {
  db?: TransactionSQLite
  drizzle?: LibSQLDatabase
  raw?: string
  sql?: SQL<unknown>
}) => SQLiteRaw<Promise<unknown>> | SQLiteRaw<ResultSet>

export type GenerateDrizzleJSON = (args: {
  schema: Record<string, GenericRelation | GenericTable>
}) => Record<string, unknown>

export type Insert = (args: {
  db: SQLiteDB | TransactionSQLite
  onConflictDoUpdate?: SQLiteInsertOnConflictDoUpdateConfig<any>
  tableName: string
  values: Record<string, unknown> | Record<string, unknown>[]
}) => Promise<Record<string, unknown>[]>

export type SQLiteAdapter = DrizzleAdapter & {
  client: Client
  clientConfig: Args['client']
  countDistinct: CountDistinct
  defaultDrizzleSnapshot: any
  deleteWhere: DeleteWhere
  drizzle: LibSQLDatabase
  dropTables: DropTables
  execute: Execute
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  generateDrizzleJSON: GenerateDrizzleJSON
  idType: Args['idType']
  initializing: Promise<void>
  insert: Insert
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  push: boolean
  rejectInitializing: () => void
  relationshipsSuffix?: string
  resolveInitializing: () => void
  schema: Record<string, GenericRelation | GenericTable>
  schemaName?: Args['schemaName']
  sessions: {
    [id: string]: {
      db: TransactionSQLite
      reject: () => Promise<void>
      resolve: () => Promise<void>
    }
  }
  tableNameMap: Map<string, string>
  tables: Record<string, GenericTable>
  versionsSuffix?: string
}

export type IDType = 'integer' | 'numeric' | 'text'

export type MigrateUpArgs = { payload: Payload; req?: Partial<PayloadRequestWithData> }
export type MigrateDownArgs = { payload: Payload; req?: Partial<PayloadRequestWithData> }

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'idType' | 'logger' | 'migrationDir' | 'pool'>,
      DrizzleAdapter {
    /**
     * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
     * Used for returning properly formed errors from unique fields
     */
    fieldConstraints: Record<string, Record<string, string>>
    idType: Args['idType']
    initializing: Promise<void>
    localesSuffix?: string
    logger: DrizzleConfig['logger']
    push: boolean
    rejectInitializing: () => void
    relationshipsSuffix?: string
    resolveInitializing: () => void
    schema: Record<string, GenericRelation | GenericTable>
    tableNameMap: Map<string, string>
    versionsSuffix?: string
  }
}
