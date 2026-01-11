import type {
  ApplyDisableErrors,
  CollectionSlug,
  PayloadTypesShape,
  SelectType,
  TypedLocale,
} from 'payload'

import type { PayloadSDK } from '../index.js'
import type { JoinQuery, PopulateType, TransformCollectionWithSelect } from '../types.js'

export type FindByIDOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
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
   * The ID of the document to find.
   */
  id: number | string
  /**
   * The [Join Field Query](https://payloadcms.com/docs/fields/join#query-options).
   * Pass `false` to disable all join fields from the result.
   */
  joins?: JoinQuery<T, TSlug>
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
  select?: TSelect
}

export async function findByID<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
>(
  sdk: PayloadSDK<T>,
  options: FindByIDOptions<T, TSlug, TDisableErrors, TSelect>,
  init?: RequestInit,
): Promise<ApplyDisableErrors<TransformCollectionWithSelect<T, TSlug, TSelect>, TDisableErrors>> {
  try {
    const response = await sdk.request({
      args: options,
      init,
      method: 'GET',
      path: `/${options.collection}/${options.id}`,
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
