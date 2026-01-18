import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload';
export type Resolver<TSlug extends CollectionSlug> = (_: unknown, args: {
    autosave: boolean;
    data: DataFromCollectionSlug<TSlug>;
    draft: boolean;
    fallbackLocale?: string;
    id: number | string;
    locale?: string;
    trash?: boolean;
}, context: {
    req: PayloadRequest;
}) => Promise<DataFromCollectionSlug<TSlug>>;
export declare function updateResolver<TSlug extends CollectionSlug>(collection: Collection): Resolver<TSlug>;
//# sourceMappingURL=update.d.ts.map