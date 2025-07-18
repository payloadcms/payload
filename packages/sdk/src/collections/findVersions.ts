import type { PaginatedDocs, SelectType, Sort, TypeWithVersion, Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type FindVersionsOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
> = {
  collection: TSlug
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  limit?: number
  locale?: 'all' | TypedLocale<T>
  page?: number
  populate?: PopulateType<T>
  select?: SelectType
  sort?: Sort
  where?: Where
}

export async function findVersions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: FindVersionsOptions<T, TSlug>,
  init?: RequestInit,
): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<T, TSlug>>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/${options.collection}/versions`,
  })

  return response.json()
}
