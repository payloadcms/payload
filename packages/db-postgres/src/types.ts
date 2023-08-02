import { Relation, Relations } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn, PgColumnHKT, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { Payload } from 'payload';
import { DatabaseAdapter } from 'payload/dist/database/types';
import { ClientConfig, PoolConfig } from 'pg';

export type DrizzleDB = NodePgDatabase<Record<string, never>>

type BaseArgs = {
  migrationDir?: string;
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

export type GenericColumn = PgColumn<PgColumnHKT, {
  tableName: string;
  name: string;
  data: unknown;
  driverParam: unknown;
  notNull: boolean;
  hasDefault: boolean;
}>

export type GenericColumns = {
  [x: string]: GenericColumn
}

export type GenericTable = PgTableWithColumns<{
  name: string, schema: undefined, columns: GenericColumns
}>

export type PostgresAdapter = DatabaseAdapter & Args & {
  db: DrizzleDB
  tables: Record<string, GenericTable>
  relations: Record<string, Relations<string, Record<string, Relation<string>>>>
}

export type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter
