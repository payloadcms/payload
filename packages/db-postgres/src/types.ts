import type {
  ColumnBaseConfig,
  ColumnDataType,
  DrizzleConfig,
  ExtractTablesWithRelations,
  Relation,
  Relations,
} from 'drizzle-orm'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgEnum, PgTableWithColumns, PgTransaction } from 'drizzle-orm/pg-core'
import type { Payload } from 'payload'
import type { BaseDatabaseAdapter } from 'payload/database'
import type { CustomName } from 'payload/dist/database/types'
import type { BaseArrayField, BaseBlock, BaseSelectField } from 'payload/dist/fields/config/types'
import type { BaseGlobalConfig } from 'payload/dist/globals/config/types'
import type { PayloadRequest } from 'payload/types'
import type { Pool, PoolConfig } from 'pg'

export type DrizzleDB = NodePgDatabase<Record<string, unknown>>

export type Args = {
  localesSuffix?: string
  idType?: 'serial' | 'uuid'
  logger?: DrizzleConfig['logger']
  migrationDir?: string
  pool: PoolConfig
  push?: boolean
  relationshipsSuffix?: string
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
  /**
   * Used internally to map the block name to the table name
   */
  blockTableNames: Record<string, string>
  drizzle: DrizzleDB
  enums: Record<string, GenericEnum>
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>
  idType: Args['idType']
  localesSuffix?: string
  logger: DrizzleConfig['logger']
  pool: Pool
  poolOptions: Args['pool']
  push: boolean
  relations: Record<string, GenericRelation>
  relationshipsSuffix?: string
  schema: Record<string, GenericEnum | GenericRelation | GenericTable>
  sessions: {
    [id: string]: {
      db: DrizzleTransaction
      reject: () => Promise<void>
      resolve: () => Promise<void>
    }
  }
  tables: Record<string, GenericTable>
  versionsSuffix?: string
}

export type IDType = 'integer' | 'numeric' | 'uuid' | 'varchar'

export type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter

export type MigrateUpArgs = {
  payload: Payload
  req?: Partial<PayloadRequest>
}
export type MigrateDownArgs = {
  payload: Payload
  req?: Partial<PayloadRequest>
}

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<Args, 'migrationDir' | 'pool'>,
      BaseDatabaseAdapter {
    drizzle: DrizzleDB
    enums: Record<string, GenericEnum>
    fieldConstraints: Record<string, Record<string, string>>
    localeSuffix?: string
    pool: Pool
    push: boolean
    relations: Record<string, GenericRelation>
    relationshipsSuffix?: string
    schema: Record<string, GenericEnum | GenericRelation | GenericTable>
    sessions: {
      [id: string]: {
        db: DrizzleTransaction
        reject: () => Promise<void>
        resolve: () => Promise<void>
      }
    }
    tables: Record<string, GenericTable>
    versionsSuffix?: string
  }
}

declare module 'payload/types' {
  export interface GlobalConfig extends BaseGlobalConfig {
    /**
     * Customize the SQL table name
     */
    dbName?: CustomName
  }

  export interface ArrayField extends BaseArrayField {
    /**
     * Customize the SQL table name
     */
    dbName?: CustomName
  }

  export interface Block extends BaseBlock {
    /**
     * Customize the SQL table name
     */
    dbName?: CustomName
  }

  export interface SelectField extends BaseSelectField {
    /**
     * Customize the SQL table name when using `hasMany: true`
     */
    dbName?: CustomName
  }
}
