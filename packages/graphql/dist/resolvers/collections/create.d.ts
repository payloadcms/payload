import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest, RequiredDataFromCollectionSlug } from 'payload';
export type Resolver<TSlug extends CollectionSlug> = (_: unknown, args: {
    data: RequiredDataFromCollectionSlug<TSlug>;
    draft: boolean;
    locale?: string;
}, context: {
    req: PayloadRequest;
}) => Promise<DataFromCollectionSlug<TSlug>>;
export declare function createResolver<TSlug extends CollectionSlug>(collection: Collection): Resolver<TSlug>;
//# sourceMappingURL=create.d.ts.map