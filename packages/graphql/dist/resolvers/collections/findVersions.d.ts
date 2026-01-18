import type { GraphQLResolveInfo } from 'graphql';
import type { Collection, PaginatedDocs, Where } from 'payload';
import type { Context } from '../types.js';
export type Resolver = (_: unknown, args: {
    draft?: boolean;
    fallbackLocale?: string;
    limit?: number;
    locale?: string;
    page?: number;
    pagination?: boolean;
    select?: boolean;
    sort?: string;
    trash?: boolean;
    where: Where;
}, context: Context, info: GraphQLResolveInfo) => Promise<PaginatedDocs<any>>;
export declare function findVersionsResolver(collection: Collection): Resolver;
//# sourceMappingURL=findVersions.d.ts.map