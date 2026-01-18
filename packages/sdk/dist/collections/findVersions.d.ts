import type { CollectionSlug, PaginatedDocs, PayloadTypesShape, SelectType, Sort, TypedLocale, TypeWithVersion, Where } from 'payload';
import type { PayloadSDK } from '../index.js';
import type { DataFromCollectionSlug, PopulateType } from '../types.js';
export type FindVersionsOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = {
    /**
     * the Collection slug to operate against.
     */
    collection: TSlug;
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * Whether the documents should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
     */
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale<T>;
    /**
     * The maximum related documents to be returned.
     * Defaults unless `defaultLimit` is specified for the collection config
     * @default 10
     */
    limit?: number;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale<T>;
    /**
     * Get a specific page number
     * @default 1
     */
    page?: number;
    /**
     * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
     * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
     */
    pagination?: boolean;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType<T>;
    /**
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * Sort the documents, can be a string or an array of strings
     * @example '-version.createdAt' // Sort DESC by createdAt
     * @example ['version.group', '-version.createdAt'] // sort by 2 fields, ASC group and DESC createdAt
     */
    sort?: Sort;
    /**
     * When set to `true`, the query will include both normal and trashed (soft-deleted) documents.
     * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
     * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
     *
     * This argument has no effect unless `trash` is enabled on the collection.
     * @default false
     */
    trash?: boolean;
    /**
     * A filter [query](https://payloadcms.com/docs/queries/overview)
     */
    where?: Where;
};
export declare function findVersions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>>(sdk: PayloadSDK<T>, options: FindVersionsOptions<T, TSlug>, init?: RequestInit): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<T, TSlug>>>>;
//# sourceMappingURL=findVersions.d.ts.map