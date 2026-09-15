import type {
  CollectionSlug,
  PaginatedDocs,
  PayloadTypesShape,
  ReadVersion,
  Sort,
  TypedLocale,
  Where,
} from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionVersionOptions,
  JoinQuery,
  PopulateType,
  SelectFromCollectionSlug,
  TransformCollectionWithSelectByVersion,
} from '../types.js'

export type FindOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
  /**
   * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
   * Pass `false` to disable all join fields from the result.
   */
  joins?: JoinQuery<T, TSlug>
  /**
   * The maximum related documents to be returned.
   * Defaults unless `defaultLimit` is specified for the collection config
   * @default 10
   */
  limit?: number
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale<T>
  /**
   * Get a specific page number
   * @default 1
   */
  page?: number
  /**
   * Set to `false` to return all documents and avoid querying for document counts which introduces some overhead.
   * You can also combine that property with a specified `limit` to limit documents but avoid the count query.
   */
  pagination?: boolean
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType<T>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-createdAt' // Sort DESC by createdAt
   * @example ['group', '-createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * When set to `true`, the query will include both normal and trashed documents.
   * To query only trashed documents, pass `trash: true` and combine with a `where` clause filtering by `deletedAt`.
   * By default (`false`), the query will only include normal documents and exclude those with a `deletedAt` field.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
} & CollectionVersionOptions<TSlug>

export async function find<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
  TVersion extends ReadVersion | undefined = undefined,
>(
  sdk: PayloadSDK<T>,
  options: { version?: TVersion } & FindOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<PaginatedDocs<TransformCollectionWithSelectByVersion<T, TSlug, TSelect, TVersion>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/${options.collection}`,
  })

  return response.json()
}
