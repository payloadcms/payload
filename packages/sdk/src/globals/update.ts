import type {
  DocumentVersion,
  GlobalSlug,
  LocaleDataOptions,
  PayloadTypesShape,
  TypedLocale,
} from 'payload'
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
  TSelect extends SelectFromGlobalSlug<T, TSlug>,
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
  /** The document snapshot to read or update. */
  version?: DocumentVersion
} & LocaleDataOptions<DeepPartial<Omit<DataFromGlobalSlug<T, TSlug>, 'id'>>, TypedLocale<T>>

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
