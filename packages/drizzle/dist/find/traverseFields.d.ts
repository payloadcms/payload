import { type FlattenedField, type JoinQuery, type SelectMode, type SelectType } from 'payload';
import type { BuildQueryJoinAliases, DrizzleAdapter } from '../types.js';
import type { Result } from './buildFindManyArgs.js';
type TraverseFieldArgs = {
    _locales: Result;
    adapter: DrizzleAdapter;
    collectionSlug?: string;
    currentArgs: Result;
    currentTableName: string;
    depth?: number;
    draftsEnabled?: boolean;
    fields: FlattenedField[];
    forceWithFields?: boolean;
    joinQuery: JoinQuery;
    joins?: BuildQueryJoinAliases;
    locale?: string;
    parentIsLocalized?: boolean;
    path: string;
    select?: SelectType;
    selectAllOnCurrentLevel?: boolean;
    selectMode?: SelectMode;
    tablePath: string;
    topLevelArgs: Record<string, unknown>;
    topLevelTableName: string;
    versions?: boolean;
    withTabledFields: {
        numbers?: boolean;
        rels?: boolean;
        texts?: boolean;
    };
};
export declare const traverseFields: ({ _locales, adapter, collectionSlug, currentArgs, currentTableName, depth, draftsEnabled, fields, forceWithFields, joinQuery, joins, locale, parentIsLocalized, path, select, selectAllOnCurrentLevel, selectMode, tablePath, topLevelArgs, topLevelTableName, versions, withTabledFields, }: TraverseFieldArgs) => Record<string, unknown>;
export {};
//# sourceMappingURL=traverseFields.d.ts.map