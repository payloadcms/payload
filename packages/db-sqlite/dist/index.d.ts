import type { DatabaseAdapterObj } from 'payload';
import type { Args, SQLiteAdapter } from './types.js';
export declare function sqliteAdapter(args: Args): DatabaseAdapterObj<SQLiteAdapter>;
/**
 * @todo deprecate /types subpath export in 4.0
 */
export type { Args as SQLiteAdapterArgs, CountDistinct, DeleteWhere, DropDatabase, Execute, GeneratedDatabaseSchema, GenericColumns, GenericRelation, GenericTable, IDType, Insert, MigrateDownArgs, MigrateUpArgs, SQLiteAdapter, SQLiteSchemaHook, } from './types.js';
export { sql } from 'drizzle-orm';
//# sourceMappingURL=index.d.ts.map