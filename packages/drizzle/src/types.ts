import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'
import type {
  Column,
  ColumnBaseConfig,
  ColumnBuilder,
  ColumnDataType,
  DrizzleConfig,
  ExtractTablesWithRelations,
  Relation,
  Relations,
} from 'drizzle-orm'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type {
  PgColumn,
  PgColumnBuilder,
  PgColumnBuilderBase,
  PgSchema,
  PgTableFn,
  PgTableWithColumns,
  PgTransaction,
} from 'drizzle-orm/pg-core'
import type { BaseDatabaseAdapter, MigrationTemplateArgs } from 'payload/database'

import { Field, FieldAffectingData } from 'payload/types'

export type DrizzleDB = NodePgDatabase<Record<string, unknown>>

export type GenericColumn = PgColumn<
  ColumnBaseConfig<ColumnDataType, string>,
  Record<string, unknown>
>

export type GenericColumns = {
  [x: string]: GenericColumn
}

export type GenericTable = PgTableWithColumns<{
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

type FieldColumnMapKey =
  | 'checkbox'
  | 'date'
  | 'email'
  | 'json'
  | 'number'
  | 'radio'
  | 'richText'
  | 'select'
  | 'text'
  | 'textarea'

export type DrizzleAdapter = BaseDatabaseAdapter & {
  defaultDrizzleSnapshot: DrizzleSnapshotJSON
  drizzle: DrizzleDB
  enums?: Record<string, unknown>
  features: {
    json?: boolean
  }
  fieldColumnMap: {
    postgres: {
      [K in FieldColumnMapKey]: typeof PgColumnBuilder
    }
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
  tableFunction: PgSchema['table'] | PgTableFn
  tableNameMap: Map<string, string>
  tables: Record<string, GenericTable>
  versionsSuffix?: string
}
