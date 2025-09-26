import type { SelectType, Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  BulkOperationResult,
  CollectionSlug,
  PayloadGeneratedTypes,
  PopulateType,
  SelectFromCollectionSlug,
  TransformCollectionWithSelect,
  TypedLocale,
} from '../types.js'

export type DeleteBaseOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
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
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
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

export type DeleteByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  /**
   * The ID of the document to delete.
   */
  id: number | string

  where?: never
} & DeleteBaseOptions<T, TSlug, TSelect>

export type DeleteManyOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id?: never
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
  where: Where
} & DeleteBaseOptions<T, TSlug, TSelect>

export type DeleteOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = DeleteByIDOptions<T, TSlug, TSelect> | DeleteManyOptions<T, TSlug, TSelect>

export async function deleteOperation<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
>(
  sdk: PayloadSDK<T>,
  options: DeleteOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<
  BulkOperationResult<T, TSlug, TSelect> | TransformCollectionWithSelect<T, TSlug, TSelect>
> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'DELETE',
    path: `/${options.collection}${options.id ? `/${options.id}` : ''}`,
  })

  const json = await response.json()

  if (options.id) {
    return json.doc
  }

  return json
}
