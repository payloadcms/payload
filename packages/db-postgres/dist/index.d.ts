import type { DatabaseAdapterObj } from 'payload';
import type { Args, PostgresAdapter } from './types.js';
export declare function postgresAdapter(args: Args): DatabaseAdapterObj<PostgresAdapter>;
export type { Args as PostgresAdapterArgs, GeneratedDatabaseSchema, PostgresAdapter, } from './types.js';
export type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/drizzle/postgres';
export { geometryColumn } from '@payloadcms/drizzle/postgres';
export { sql } from 'drizzle-orm';
//# sourceMappingURL=index.d.ts.map