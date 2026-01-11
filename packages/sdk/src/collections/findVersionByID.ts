import type {
  ApplyDisableErrors,
  CollectionSlug,
  GeneratedTypesShape,
  SelectType,
  TypedLocale,
  TypeWithVersion,
} from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromCollectionSlug, PopulateType } from '../types.js'

export type FindVersionByIDOptions<
  T extends GeneratedTypesShape,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
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
   * When set to `true`, errors will not be thrown.
   * `null` will be returned instead, if the document on this ID was not found.
   */
  disableErrors?: TDisableErrors
  /**
   * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
   */
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
  /**
   * The ID of the version to find.
   */
  id: number | string
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale<T>
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType<T>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: SelectType
  /**
   * When set to `true`, the operation will return a document by ID, even if it is trashed (soft-deleted).
   * By default (`false`), the operation will exclude trashed documents.
   * To fetch a trashed document, set `trash: true`.
   *
   * This argument has no effect unless `trash` is enabled on the collection.
   * @default false
   */
  trash?: boolean
}

export async function findVersionByID<
  T extends GeneratedTypesShape,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
>(
  sdk: PayloadSDK<T>,
  options: FindVersionByIDOptions<T, TSlug, TDisableErrors>,
  init?: RequestInit,
): Promise<ApplyDisableErrors<TypeWithVersion<DataFromCollectionSlug<T, TSlug>>, TDisableErrors>> {
  try {
    const response = await sdk.request({
      args: options,
      init,
      method: 'GET',
      path: `/${options.collection}/versions/${options.id}`,
    })

    return response.json()
  } catch (err) {
    if (options.disableErrors) {
      // @ts-expect-error generic nullable
      return null
    }

    throw err
  }
}
