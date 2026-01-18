import type { GraphQLResolveInfo } from 'graphql';
import type { Collection, CollectionSlug, DataFromCollectionSlug } from 'payload';
import type { Context } from '../types.js';
export type Resolver<TData> = (_: unknown, args: {
    draft: boolean;
    fallbackLocale?: string;
    id: string;
    locale?: string;
    select?: boolean;
    trash?: boolean;
}, context: Context, info: GraphQLResolveInfo) => Promise<TData>;
export declare function findByIDResolver<TSlug extends CollectionSlug>(collection: Collection): Resolver<DataFromCollectionSlug<TSlug>>;
//# sourceMappingURL=findByID.d.ts.map