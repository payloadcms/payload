import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload';
export type Resolver<TSlug extends CollectionSlug> = (_: unknown, args: {
    draft: boolean;
    fallbackLocale?: string;
    id: number | string;
    locale?: string;
    trash?: boolean;
}, context: {
    req: PayloadRequest;
}) => Promise<DataFromCollectionSlug<TSlug>>;
export declare function getDeleteResolver<TSlug extends CollectionSlug>(collection: Collection): Resolver<TSlug>;
//# sourceMappingURL=delete.d.ts.map