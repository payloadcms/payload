import type {
  ColumnBaseConfig,
  ColumnDataType,
  ExtractTablesWithRelations,
  Relation,
  Relations,
} from 'drizzle-orm'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgEnum, PgTableWithColumns, PgTransaction } from 'drizzle-orm/pg-core'
import type { Payload } from 'payload'
import type { BaseDatabaseAdapter } from 'payload/database'
import type { BaseCollectionConfig } from 'payload/dist/collections/config/types'
import type {
  BaseArrayField,
  BaseBlock,
  BaseRadioField,
  BaseSelectField,
} from 'payload/dist/fields/config/types'
import type { BaseGlobalConfig } from 'payload/dist/globals/config/types'
import type { Pool, PoolConfig } from 'pg'

export type DrizzleDB = NodePgDatabase<Record<string, unknown>>

export type Args = {
  migrationDir?: string
  pool: PoolConfig
  push?: boolean
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
  schema: undefined
}>

export type GenericEnum = PgEnum<[string, ...string[]]>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type DrizzleTransaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, unknown>,
  ExtractTablesWithRelations<Record<string, unknown>>
>

export type PostgresAdapter = BaseDatabaseAdapter & {
  drizzle: DrizzleDB
  enums: Record<string, GenericEnum>
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  pool: Pool
  poolOptions: Args['pool']
  push: boolean
  relations: Record<string, GenericRelation>
  schema: Record<string, GenericEnum | GenericRelation | GenericTable>
  sessions: {
    [id: string]: {
      db: DrizzleTransaction
      reject: () => void
      resolve: () => void
    }
  }
  tables: Record<string, GenericTable>
}

export type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter

export type MigrateUpArgs = { payload: Payload }
export type MigrateDownArgs = { payload: Payload }

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'migrationDir' | 'pool'>,
      BaseDatabaseAdapter {
    drizzle: DrizzleDB
    enums: Record<string, GenericEnum>
    fieldConstraints: Record<string, Record<string, string>>
    pool: Pool
    push: boolean
    relations: Record<string, GenericRelation>
    schema: Record<string, GenericEnum | GenericRelation | GenericTable>
    sessions: {
      [id: string]: {
        db: DrizzleTransaction
        reject: () => void
        resolve: () => void
      }
    }
    tables: Record<string, GenericTable>
  }
}

declare module 'payload/types' {
  export interface CollectionConfig extends BaseCollectionConfig {
    /**
     * Customize the SQL table name
     */
    tableName?: string
  }

  export interface GlobalConfig extends BaseGlobalConfig {
    /**
     * Customize the SQL table name
     */
    tableName?: string
  }

  export interface ArrayField extends BaseArrayField {
    /**
     * Customize the SQL table name
     */
    tableName?: string
  }

  export interface RadioField extends BaseRadioField {
    /**
     * Customize the SQL enum name
     */
    enumName?: string
  }

  export interface Block extends BaseBlock {
    /**
     * Customize the SQL table name
     */
    tableName?: string
  }

  export interface SelectField extends BaseSelectField {
    /**
     * Customize the SQL enum name
     */
    enumName?: string
    /**
     * Customize the SQL table name when using `hasMany: true`
     */
    tableName?: string
  }
}
