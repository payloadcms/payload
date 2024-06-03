import type { Client, Config } from '@libsql/client'
import type {
  BuildQueryJoinAliases,
  DrizzleAdapter,
  TransactionSQLite,
} from '@payloadcms/drizzle/types'
import type {
  SQLiteColumn,
  SQLiteInsertOnConflictDoUpdateConfig,
  SQLiteTableWithColumns,
} from 'drizzle-orm/sqlite-core'
import type { Payload } from 'payload'
import type { PayloadRequestWithData } from 'payload/types'

import {
  type ColumnBaseConfig,
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
  ColumnBaseConfig<ColumnDataType, string>,
  Record<string, unknown>
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

export type SQLiteAdapter = DrizzleAdapter & {
  client: Client
  countDistinct: (args: {
    db: TransactionSQLite
    joins: BuildQueryJoinAliases
    tableName: string
    where: SQL
  }) => Promise<number>
  deleteWhere: (args: { db: TransactionSQLite; tableName: string; where: SQL }) => Promise<void>
  execute: (args: { db: TransactionSQLite; sql: SQL<unknown> }) => Promise<void>
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  idType: Args['idType']
  initializing: Promise<void>
  insert: (args: {
    db: TransactionSQLite
    onConflictDoUpdate?: SQLiteInsertOnConflictDoUpdateConfig<any>
    tableName: string
    values: Record<string, unknown> | Record<string, unknown>[]
  }) => Promise<Record<string, unknown>[]>
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  push: boolean
  rejectInitializing: () => void
  relationshipsSuffix?: string
  resolveInitializing: () => void
  schema: Record<string, GenericRelation | GenericTable>
  schemaName?: Args['schemaName']
  tableNameMap: Map<string, string>
  tables: Record<string, GenericTable>
  versionsSuffix?: string
}

export type IDType = 'integer' | 'numeric' | 'uuid' | 'varchar'

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
