import type { DatabaseAdapterObj } from 'payload';
import type { Args, VercelPostgresAdapter } from './types.js';
export declare function vercelPostgresAdapter(args?: Args): DatabaseAdapterObj<VercelPostgresAdapter>;
/**
 * @todo deprecate /types subpath export in 4.0
 */
export type { Args as VercelPostgresAdapterArgs, GeneratedDatabaseSchema, VercelPostgresAdapter, } from './types.js';
export type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/drizzle/postgres';
export { geometryColumn } from '@payloadcms/drizzle/postgres';
export { sql } from 'drizzle-orm';
//# sourceMappingURL=index.d.ts.map