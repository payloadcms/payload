import type { Client } from '@libsql/client'
import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'
import type {
  Column,
  ColumnBaseConfig,
  ColumnBuilder,
  ColumnBuilderBase,
  ColumnBuilderBaseConfig,
  ColumnDataType,
  DrizzleConfig,
  ExtractTablesWithRelations,
  Relation,
  Relations,
  Table,
} from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgTable, PgTransaction } from 'drizzle-orm/pg-core'
import type { BaseDatabaseAdapter, MigrationTemplateArgs } from 'payload/database'

export type PostgresDB = NodePgDatabase<Record<string, unknown>>

export type SQLiteDB = LibSQLDatabase<
  Record<string, unknown> & Record<string, GenericRelation | GenericTable>
>

export type GenericColumn = PgColumn<
  ColumnBaseConfig<ColumnDataType, string>,
  Record<string, unknown>
>

export type GenericColumns = {
  [x: string]: GenericColumn
}

export type GenericTable = PgTable<{
  columns: GenericColumns
  dialect: string
  name: string
  schema: undefined
}>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type DrizzleTransaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, unknown>,
  ExtractTablesWithRelations<Record<string, unknown>>
>

export type DrizzleAdapter = BaseDatabaseAdapter & {
  defaultDrizzleSnapshot: DrizzleSnapshotJSON
  drizzle: PostgresDB | SQLiteDB
  enums?: Record<string, unknown>
  features: {
    json?: boolean
  }
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  getMigrationTemplate: (args: MigrationTemplateArgs) => string
  // TODO: figure out the type for idType
  idType: unknown
  initializing: Promise<void>
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
