import type { GlobalSlug, PayloadTypesShape, ReadVersion, TypedLocale } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  GlobalVersionOptions,
  PopulateType,
  SelectFromGlobalSlug,
  TransformGlobalWithSelectByVersion,
} from '../types.js'

export type FindGlobalOptions<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
  TSelect = SelectFromGlobalSlug<T, TSlug>,
> = {
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
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
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
} & GlobalVersionOptions<TSlug>

export async function findGlobal<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectFromGlobalSlug<T, TSlug>,
  TVersion extends ReadVersion | undefined = undefined,
>(
  sdk: PayloadSDK<T>,
  options: { version?: TVersion } & FindGlobalOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<TransformGlobalWithSelectByVersion<T, TSlug, TSelect, TVersion>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/globals/${options.slug}`,
  })

  return response.json()
}
