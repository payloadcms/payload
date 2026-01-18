import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload';
export type Resolver<TData> = (_: unknown, args: {
    data: TData;
    draft: boolean;
    fallbackLocale?: string;
    id: string;
    locale?: string;
}, context: {
    req: PayloadRequest;
}) => Promise<TData>;
export declare function duplicateResolver<TSlug extends CollectionSlug>(collection: Collection): Resolver<DataFromCollectionSlug<TSlug>>;
//# sourceMappingURL=duplicate.d.ts.map