import type { CollectionSlug, PayloadTypesShape, TypedLocale } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type {
  PopulateType,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
  TransformCollectionWithSelect,
} from '../types.js'

export type DuplicateOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * Data to override on the copy.
   */
  data?: DeepPartial<RequiredDataFromCollectionSlug<T, TSlug>>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Create the copy as a draft. The REST API defaults this to `true`.
   */
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
  /**
   * The ID of the document to duplicate.
   */
  id: number | string
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale<T>
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType<T>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
}

export async function duplicate<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
>(
  sdk: PayloadSDK<T>,
  options: DuplicateOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<TransformCollectionWithSelect<T, TSlug, TSelect>> {
  const response = await sdk.request({
    args: options,
    init,
    json: options.data ?? {},
    method: 'POST',
    path: `/${options.collection}/${options.id}/duplicate`,
  })

  const json = await response.json()

  return json.doc
}
