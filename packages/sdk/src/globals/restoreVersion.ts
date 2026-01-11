import type { BaseGeneratedTypes, GlobalSlug, TypedLocale, TypeWithVersion } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromGlobalSlug, PopulateType } from '../types.js'

export type RestoreGlobalVersionByIDOptions<
  T extends BaseGeneratedTypes,
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
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
}

export async function restoreGlobalVersion<
  T extends BaseGeneratedTypes,
  TSlug extends GlobalSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: RestoreGlobalVersionByIDOptions<T, TSlug>,
  init?: RequestInit,
): Promise<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'POST',
    path: `/globals/${options.slug}/versions/${options.id}`,
  })

  const { doc } = await response.json()

  return doc
}
