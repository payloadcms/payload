import type {
  ApplyDisableErrors,
  CollectionSlug,
  FindOptions,
  PayloadTypesShape,
  ReadVersion,
  SelectType,
  TypedLocale,
} from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionVersionOptions,
  JoinQuery,
  PopulateType,
  SelectFromCollectionSlug,
  TransformCollectionWithSelectByVersion,
} from '../types.js'

export type FindByIDOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
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
   * When `true`, returns the document even if it is trashed. No effect unless the collection has `trash` enabled.
   * @default false
   */
  trash?: boolean
} & CollectionVersionOptions<TSlug> &
  Pick<FindOptions<TSlug, SelectType & TSelect>, 'select'>

export async function findByID<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
  TVersion extends ReadVersion | undefined = undefined,
>(
  sdk: PayloadSDK<T>,
  options: { version?: TVersion } & FindByIDOptions<T, TSlug, TDisableErrors, TSelect>,
  init?: RequestInit,
): Promise<
  ApplyDisableErrors<
    TransformCollectionWithSelectByVersion<T, TSlug, TSelect, TVersion>,
    TDisableErrors
  >
> {
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
