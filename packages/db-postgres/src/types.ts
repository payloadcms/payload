import type { ColumnBaseConfig, ColumnDataType, Relation, Relations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgEnum, PgTableWithColumns } from 'drizzle-orm/pg-core';
import type { Payload } from 'payload';
import type { DatabaseAdapter } from 'payload/database';
import type { ClientConfig, PoolConfig } from 'pg';

export type DrizzleDB = NodePgDatabase<Record<string, never>>

type BaseArgs = {
  migrationDir?: string;
  migrationName?: string;
}

type ClientArgs = {
  /** Client connection options for the Node package `pg` */
  client?: ClientConfig | false | string
} & BaseArgs

type PoolArgs = {
  /** Pool connection options for the Node package `pg` */
  pool?: PoolConfig | false
} & BaseArgs

export type Args = ClientArgs | PoolArgs

export type GenericColumn = PgColumn<ColumnBaseConfig<ColumnDataType, string>, Record<string, unknown>>

export type GenericColumns = {
  [x: string]: GenericColumn
}

export type GenericTable = PgTableWithColumns<{
  columns: GenericColumns, dialect: string, name: string, schema: undefined
}>

export type GenericEnum = PgEnum<[string, ...string[]]>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type PostgresAdapter = DatabaseAdapter & Args & {
  db: DrizzleDB
  enums: Record<string, GenericEnum>
  relations: Record<string, GenericRelation>
  schema: Record<string, GenericEnum | GenericRelation | GenericTable>
  tables: Record<string, GenericTable>
}

export type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter
