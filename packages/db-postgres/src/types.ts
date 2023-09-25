import type {
  ColumnBaseConfig,
  ColumnDataType,
  Relation,
  RelationalSchemaConfig,
  Relations,
} from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgEnum, PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { DatabaseAdapter, Payload } from 'payload'
import type { Pool, PoolConfig } from 'pg'

export type DrizzleDB = NodePgDatabase<Record<string, unknown>>

export type Args = {
  client: PoolConfig
  migrationDir?: string
  migrationName?: string
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

export type PostgresAdapter = DatabaseAdapter &
  Args & {
    db: DrizzleDB
    enums: Record<string, GenericEnum>
    pool: Pool
    relations: Record<string, GenericRelation>
    schema: RelationalSchemaConfig<any>
    sessions: {
      [id: string]: {
        db: DrizzleDB
        reject: () => void
        resolve: () => void
      }
    }
    tables: Record<string, GenericTable>
  }

export type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter
