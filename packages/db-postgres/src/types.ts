import type {
  BuildQueryJoinAliases,
  DrizzleAdapter,
  PostgresDB,
  TransactionPg,
} from '@payloadcms/drizzle/types'
import type {
  ColumnBaseConfig,
  ColumnDataType,
  DrizzleConfig,
  Relation,
  Relations,
  SQL,
} from 'drizzle-orm'
import type {
  PgColumn,
  PgEnum,
  PgInsertOnConflictDoUpdateConfig,
  PgSchema,
  PgTableWithColumns,
} from 'drizzle-orm/pg-core'
import type { PgTableFn } from 'drizzle-orm/pg-core/table'
import type { Payload } from 'payload'
import type { PayloadRequestWithData } from 'payload/types'
import type { Pool, PoolConfig } from 'pg'

import { DrizzleTransaction } from '@payloadcms/drizzle/types'

export type Args = {
  idType?: 'serial' | 'uuid'
  localesSuffix?: string
  logger?: DrizzleConfig['logger']
  migrationDir?: string
  pool: PoolConfig
  push?: boolean
  relationshipsSuffix?: string
  schemaName?: string
  versionsSuffix?: string
}

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
  schema: string
}>

export type GenericEnum = PgEnum<[string, ...string[]]>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type PostgresAdapter = DrizzleAdapter & {
  countDistinct: (args: {
    db: TransactionPg
    joins: BuildQueryJoinAliases
    tableName: string
    where: SQL
  }) => Promise<number>
  deleteWhere: (args: { db: TransactionPg; tableName: string; where: SQL }) => Promise<void>
  drizzle: PostgresDB
  enums: Record<string, GenericEnum>
  execute: (args: { db: TransactionPg; sql: SQL<unknown> }) => Promise<void>
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  idType: Args['idType']
  initializing: Promise<void>
  insert: (args: {
    db: TransactionPg
    onConflictDoUpdate?: PgInsertOnConflictDoUpdateConfig<any>
    tableName: string
    values: Record<string, unknown> | Record<string, unknown>[]
  }) => Promise<Record<string, unknown>[]>
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  pgSchema?: { table: PgTableFn } | PgSchema
  pool: Pool
  poolOptions: Args['pool']
  push: boolean
  rejectInitializing: () => void
  relationshipsSuffix?: string
  resolveInitializing: () => void
  schema: Record<string, GenericEnum | GenericRelation | GenericTable>
  schemaName?: Args['schemaName']
  sessions: {
    [id: string]: {
      db: TransactionPg
      reject: () => Promise<void>
      resolve: () => Promise<void>
    }
  }
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
    enums: Record<string, GenericEnum>
    /**
     * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
     * Used for returning properly formed errors from unique fields
     */
    fieldConstraints: Record<string, Record<string, string>>
    idType: Args['idType']
    initializing: Promise<void>
    localesSuffix?: string
    logger: DrizzleConfig['logger']
    pgSchema?: { table: PgTableFn } | PgSchema
    pool: Pool
    poolOptions: Args['pool']
    push: boolean
    rejectInitializing: () => void
    relationshipsSuffix?: string
    resolveInitializing: () => void
    schema: Record<string, GenericEnum | GenericRelation | GenericTable>
    schemaName?: Args['schemaName']
    tableNameMap: Map<string, string>
    versionsSuffix?: string
  }
}
