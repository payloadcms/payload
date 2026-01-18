import type { SQL, Table } from 'drizzle-orm';
import type { FlattenedField, Sort } from 'payload';
import type { DrizzleAdapter, GenericColumn } from '../types.js';
import type { BuildQueryJoinAliases, BuildQueryResult } from './buildQuery.js';
type Args = {
    adapter: DrizzleAdapter;
    aliasTable?: Table;
    fields: FlattenedField[];
    joins: BuildQueryJoinAliases;
    locale?: string;
    parentIsLocalized: boolean;
    rawSort?: SQL;
    selectFields: Record<string, GenericColumn>;
    sort?: Sort;
    tableName: string;
};
/**
 * Gets the order by column and direction constructed from the sort argument adds the column to the select fields and joins if necessary
 */
export declare const buildOrderBy: ({ adapter, aliasTable, fields, joins, locale, parentIsLocalized, rawSort, selectFields, sort, tableName, }: Args) => BuildQueryResult["orderBy"];
export {};
//# sourceMappingURL=buildOrderBy.d.ts.map