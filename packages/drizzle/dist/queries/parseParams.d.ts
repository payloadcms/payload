import type { SQL, Table } from 'drizzle-orm';
import type { FlattenedField, Sort, Where } from 'payload';
import type { DrizzleAdapter, GenericColumn } from '../types.js';
import type { BuildQueryJoinAliases } from './buildQuery.js';
export type QueryContext = {
    rawSort?: SQL;
    sort: Sort;
};
type Args = {
    adapter: DrizzleAdapter;
    aliasTable?: Table;
    context: QueryContext;
    fields: FlattenedField[];
    joins: BuildQueryJoinAliases;
    locale?: string;
    parentIsLocalized: boolean;
    selectFields: Record<string, GenericColumn>;
    selectLocale?: boolean;
    tableName: string;
    where: Where;
};
export declare function parseParams({ adapter, aliasTable, context, fields, joins, locale, parentIsLocalized, selectFields, selectLocale, tableName, where, }: Args): SQL;
export {};
//# sourceMappingURL=parseParams.d.ts.map