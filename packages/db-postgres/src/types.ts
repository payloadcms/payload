import { ColumnBaseConfig, ColumnDataType, Relation, Relations } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn, PgEnum, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { Payload } from 'payload';
import { DatabaseAdapter } from 'payload/dist/database/types';
import { ClientConfig, PoolConfig } from 'pg';

export type DrizzleDB = NodePgDatabase<Record<string, never>>

type BaseArgs = {
  migrationDir?: string;
  migrationName?: string;
}

type ClientArgs = {
  /** Client connection options for the Node package `pg` */
  client?: ClientConfig | string | false
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
  name: string, schema: undefined, columns: GenericColumns, dialect: string
}>

export type GenericEnum = PgEnum<[string, ...string[]]>

export type GenericRelation = Relations<string, Record<string, Relation<string>>>

export type PostgresAdapter = DatabaseAdapter & Args & {
  db: DrizzleDB
  sessions: Record<string, DrizzleDB>
  enums: Record<string, GenericEnum>
  relations: Record<string, GenericRelation>
  tables: Record<string, GenericTable>
  schema: Record<string, GenericEnum | GenericTable | GenericRelation>
}

export type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter
