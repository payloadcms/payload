import type { GraphQLResolveInfo } from 'graphql';
import type { Document, SanitizedGlobalConfig } from 'payload';
import type { Context } from '../types.js';
export type Resolver = (_: unknown, args: {
    draft?: boolean;
    fallbackLocale?: string;
    id: number | string;
    locale?: string;
    select?: boolean;
}, context: Context, info: GraphQLResolveInfo) => Promise<Document>;
export declare function findOne(globalConfig: SanitizedGlobalConfig): Resolver;
//# sourceMappingURL=findOne.d.ts.map