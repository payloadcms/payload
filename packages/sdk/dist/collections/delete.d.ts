import type { CollectionSlug, PayloadTypesShape, SelectType, TypedLocale, Where } from 'payload';
import type { PayloadSDK } from '../index.js';
import type { BulkOperationResult, PopulateType, SelectFromCollectionSlug, TransformCollectionWithSelect } from '../types.js';
export type DeleteBaseOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect extends SelectType> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale<T>;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: TypedLocale<T>;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType<T>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: TSelect;
};
export type DeleteByIDOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>> = {
    /**
     * The ID of the document to delete.
     */
    id: number | string;
    where?: never;
} & DeleteBaseOptions<T, TSlug, TSelect>;
export type DeleteManyOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>> = {
    id?: never;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where: Where;
} & DeleteBaseOptions<T, TSlug, TSelect>;
export type DeleteOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>> = DeleteByIDOptions<T, TSlug, TSelect> | DeleteManyOptions<T, TSlug, TSelect>;
export declare function deleteOperation<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>, TSelect extends SelectFromCollectionSlug<T, TSlug>>(sdk: PayloadSDK<T>, options: DeleteOptions<T, TSlug, TSelect>, init?: RequestInit): Promise<BulkOperationResult<T, TSlug, TSelect> | TransformCollectionWithSelect<T, TSlug, TSelect>>;
//# sourceMappingURL=delete.d.ts.map