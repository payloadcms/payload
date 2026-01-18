import type { GraphQLResolveInfo } from 'graphql';
import type { Document, SanitizedGlobalConfig, Where } from 'payload';
import type { Context } from '../types.js';
export type Resolver = (_: unknown, args: {
    fallbackLocale?: string;
    limit?: number;
    locale?: string;
    page?: number;
    pagination?: boolean;
    select?: boolean;
    sort?: string;
    where: Where;
}, context: Context, info: GraphQLResolveInfo) => Promise<Document>;
export declare function findVersions(globalConfig: SanitizedGlobalConfig): Resolver;
//# sourceMappingURL=findVersions.d.ts.map