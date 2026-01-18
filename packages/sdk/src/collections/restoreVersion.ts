import type { CollectionSlug, PayloadTypesShape, TypedLocale } from '@ruya.sa/payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromCollectionSlug, PopulateType } from '../types.js'

export type RestoreVersionByIDOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
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
   * Whether the document should be queried from the versions table/collection or not. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
   */
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
  /**
   * The ID of the version to restore.
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
}

export async function restoreVersion<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: RestoreVersionByIDOptions<T, TSlug>,
  init?: RequestInit,
): Promise<DataFromCollectionSlug<T, TSlug>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'POST',
    path: `/${options.collection}/versions/${options.id}`,
  })

  return response.json()
}
