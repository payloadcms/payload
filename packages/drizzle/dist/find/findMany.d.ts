import type { FindArgs, FlattenedField } from 'payload';
import type { DrizzleAdapter } from '../types.js';
type Args = {
    adapter: DrizzleAdapter;
    collectionSlug?: string;
    fields: FlattenedField[];
    tableName: string;
    versions?: boolean;
} & Omit<FindArgs, 'collection'>;
export declare const findMany: ({ adapter, collectionSlug, draftsEnabled, fields, joins: joinQuery, limit: limitArg, locale, page, pagination, req, select, sort, tableName, versions, where: whereArg, }: Args) => Promise<{
    docs: any;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
    nextPage: number;
    page: number;
    pagingCounter: number;
    prevPage: number;
    totalDocs: number;
    totalPages: number;
}>;
export {};
//# sourceMappingURL=findMany.d.ts.map