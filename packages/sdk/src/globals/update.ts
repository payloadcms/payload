import type { GlobalSlug, PayloadTypesShape, SelectType, TypedLocale } from '@ruya.sa/payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  PopulateType,
  SelectFromGlobalSlug,
  TransformGlobalWithSelect,
} from '../types.js'

export type UpdateGlobalOptions<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectType,
> = {
  /**
   * The global data to update.
   */
  data: DeepPartial<Omit<DataFromGlobalSlug<T, TSlug>, 'id'>>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Update documents to a draft.
   */
  draft?: boolean
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
   * Publish the document / documents with a specific locale.
   */
  publishSpecificLocale?: TypedLocale<T>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
}

export async function updateGlobal<
  T extends PayloadTypesShape,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectFromGlobalSlug<T, TSlug>,
>(
  sdk: PayloadSDK<T>,
  options: UpdateGlobalOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<TransformGlobalWithSelect<T, TSlug, TSelect>> {
  const response = await sdk.request({
    args: options,
    init,
    json: options.data,
    method: 'POST',
    path: `/globals/${options.slug}`,
  })

  const { result } = await response.json()

  return result
}
