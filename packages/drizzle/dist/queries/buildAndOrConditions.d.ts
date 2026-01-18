import type { SQL, Table } from 'drizzle-orm';
import type { FlattenedField, Where } from 'payload';
import type { DrizzleAdapter, GenericColumn } from '../types.js';
import type { BuildQueryJoinAliases } from './buildQuery.js';
import type { QueryContext } from './parseParams.js';
export declare function buildAndOrConditions({ adapter, aliasTable, context, fields, joins, locale, parentIsLocalized, selectFields, selectLocale, tableName, where, }: {
    adapter: DrizzleAdapter;
    aliasTable?: Table;
    collectionSlug?: string;
    context: QueryContext;
    fields: FlattenedField[];
    globalSlug?: string;
    joins: BuildQueryJoinAliases;
    locale?: string;
    parentIsLocalized: boolean;
    selectFields: Record<string, GenericColumn>;
    selectLocale?: boolean;
    tableName: string;
    where: Where[];
}): SQL[];
//# sourceMappingURL=buildAndOrConditions.d.ts.map