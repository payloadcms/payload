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
  collection: TSlug
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  locale?: TypedLocale<T>
  populate?: PopulateType<T>
  select?: TSelect
}

export type DeleteByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id: number | string
  where?: never
} & DeleteBaseOptions<T, TSlug, TSelect>

export type DeleteManyOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id?: never
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
