import type { ApplyDisableErrors, SelectType, TypeWithVersion } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type FindVersionByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
> = {
  collection: TSlug
  depth?: number
  disableErrors?: TDisableErrors
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  id: number | string
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  select?: SelectType
}

export async function findVersionByID<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
>(
  sdk: PayloadSDK<T>,
  options: FindVersionByIDOptions<T, TSlug, TDisableErrors>,
  init?: RequestInit,
): Promise<ApplyDisableErrors<TypeWithVersion<DataFromCollectionSlug<T, TSlug>>, TDisableErrors>> {
  try {
    const response = await sdk.request({
      args: options,
      init,
      method: 'GET',
      path: `/${options.collection}/versions/${options.id}`,
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

    throw new Error(`Error retrieving the version document ${options.collection}/${options.id}`)
  }
}
