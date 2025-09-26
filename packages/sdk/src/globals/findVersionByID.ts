import type { ApplyDisableErrors, SelectType, TypeWithVersion } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type FindGlobalVersionByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TDisableErrors extends boolean,
> = {
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * When set to `true`, errors will not be thrown.
   * `null` will be returned instead, if the document on this ID was not found.
   */
  disableErrors?: TDisableErrors
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
   * the Global slug to operate against.
   */
  slug: TSlug
}

export async function findGlobalVersionByID<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TDisableErrors extends boolean,
>(
  sdk: PayloadSDK<T>,
  options: FindGlobalVersionByIDOptions<T, TSlug, TDisableErrors>,
  init?: RequestInit,
): Promise<ApplyDisableErrors<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>, TDisableErrors>> {
  try {
    const response = await sdk.request({
      args: options,
      init,
      method: 'GET',
      path: `/globals/${options.slug}/versions/${options.id}`,
    })

    if (response.ok) {
      return response.json()
    } else {
      throw new Error()
    }
  } catch {
    if (options.disableErrors) {
      // @ts-expect-error generic nullable
      return null
    }

    throw new Error(`Error retrieving the version document ${options.slug}/${options.id}`)
  }
}
