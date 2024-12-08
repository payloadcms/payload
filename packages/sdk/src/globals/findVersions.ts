import type { PaginatedDocs, SelectType, Sort, TypeWithVersion, Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type FindGlobalVersionsOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
> = {
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  limit?: number
  locale?: 'all' | TypedLocale<T>
  page?: number
  populate?: PopulateType<T>
  select?: SelectType
  slug: TSlug
  sort?: Sort
  where?: Where
}

export async function findGlobalVersions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: FindGlobalVersionsOptions<T, TSlug>,
  init?: RequestInit,
): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/globals/${options.slug}/versions`,
  })

  return response.json()
}
