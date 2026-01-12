import type { PaginatedDocs, SelectType, Sort, TypeWithVersion, Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type FindGlobalVersionsOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
> = {
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
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
  select?: SelectType
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
  /**
   * Sort the documents, can be a string or an array of strings
   * @example '-version.createdAt' // Sort DESC by createdAt
   * @example ['version.group', '-version.createdAt'] // sort by 2 fields, ASC group and DESC createdAt
   */
  sort?: Sort
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where?: Where
}

export async function findGlobalVersions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: FindGlobalVersionsOptions<T, TSlug>,
  init?: RequestInit,
): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/globals/${options.slug}/versions`,
  })

  return response.json()
}
