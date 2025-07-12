import type { PaginatedDocs, SelectType, Sort, Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionSlug,
  JoinQuery,
  PayloadGeneratedTypes,
  PopulateType,
  TransformCollectionWithSelect,
  TypedLocale,
} from '../types.js'

export type FindOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  collection: TSlug
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  joins?: JoinQuery<T, TSlug>
  limit?: number
  locale?: 'all' | TypedLocale<T>
  page?: number
  populate?: PopulateType<T>
  select?: TSelect
  sort?: Sort
  where?: Where
}

export async function find<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
>(
  sdk: PayloadSDK<T>,
  options: FindOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<PaginatedDocs<TransformCollectionWithSelect<T, TSlug, TSelect>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/${options.collection}`,
  })

  return response.json()
}
