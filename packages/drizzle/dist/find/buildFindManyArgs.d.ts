import type { DBQueryConfig } from 'drizzle-orm';
import type { FlattenedField, JoinQuery, SelectType } from 'payload';
import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js';
type BuildFindQueryArgs = {
    adapter: DrizzleAdapter;
    collectionSlug?: string;
    depth: number;
    draftsEnabled?: boolean;
    fields: FlattenedField[];
    joinQuery?: JoinQuery;
    /**
     * The joins array will be mutated by pushing any joins needed for the where queries of join field joins
     */
    joins?: BuildQueryJoinAliases;
    locale?: string;
    select?: SelectType;
    tableName: string;
    versions?: boolean;
};
export type Result = {
    with?: {
        _locales?: DBQueryConfig<'many', true, any, any>;
    } & DBQueryConfig<'many', true, any, any>;
} & DBQueryConfig<'many', true, any, any>;
export declare const buildFindManyArgs: ({ adapter, collectionSlug, depth, draftsEnabled, fields, joinQuery, joins, locale, select, tableName, versions, }: BuildFindQueryArgs) => Result;
export {};
//# sourceMappingURL=buildFindManyArgs.d.ts.map