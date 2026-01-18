import type { GraphQLResolveInfo } from 'graphql';
import type { Collection, TypeWithID, TypeWithVersion } from 'payload';
import type { Context } from '../types.js';
export type Resolver<T extends TypeWithID = any> = (_: unknown, args: {
    fallbackLocale?: string;
    id: number | string;
    locale?: string;
    select?: boolean;
    trash?: boolean;
}, context: Context, info: GraphQLResolveInfo) => Promise<TypeWithVersion<T>>;
export declare function findVersionByIDResolver(collection: Collection): Resolver;
//# sourceMappingURL=findVersionByID.d.ts.map