import type { QueryPromise, SQL } from 'drizzle-orm';
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core';
import type { DrizzleAdapter, DrizzleTransaction, GenericColumn } from '../types.js';
import type { BuildQueryJoinAliases } from './buildQuery.js';
type Args = {
    adapter: DrizzleAdapter;
    db: DrizzleAdapter['drizzle'] | DrizzleTransaction;
    forceRun?: boolean;
    joins: BuildQueryJoinAliases;
    query?: (args: {
        query: SQLiteSelect;
    }) => SQLiteSelect;
    selectFields: Record<string, GenericColumn>;
    tableName: string;
    where: SQL;
};
/**
 * Selects distinct records from a table only if there are joins that need to be used, otherwise return null
 */
export declare const selectDistinct: ({ adapter, db, forceRun, joins, query: queryModifier, selectFields, tableName, where, }: Args) => QueryPromise<{
    id: number | string;
}[] & Record<string, GenericColumn>>;
export {};
//# sourceMappingURL=selectDistinct.d.ts.map