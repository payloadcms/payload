import type { DatabaseAdapterObj } from 'payload';
import type { Args, SQLiteD1Adapter } from './types.js';
export declare function sqliteD1Adapter(args: Args): DatabaseAdapterObj<SQLiteD1Adapter>;
/**
 * @todo deprecate /types subpath export in 4.0
 */
export type { Args as SQLiteAdapterArgs, CountDistinct, DeleteWhere, DropDatabase, Execute, GeneratedDatabaseSchema, GenericColumns, GenericRelation, GenericTable, IDType, Insert, MigrateDownArgs, MigrateUpArgs, SQLiteD1Adapter as SQLiteAdapter, SQLiteSchemaHook, } from './types.js';
export { sql } from 'drizzle-orm';
//# sourceMappingURL=index.d.ts.map