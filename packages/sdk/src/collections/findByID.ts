import type { ApplyDisableErrors, SelectType } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionSlug,
  JoinQuery,
  PayloadGeneratedTypes,
  PopulateType,
  TransformCollectionWithSelect,
  TypedLocale,
} from '../types.js'

export type FindByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
> = {
  collection: TSlug
  depth?: number
  disableErrors?: TDisableErrors
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  id: number | string
  joins?: JoinQuery<T, TSlug>
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  select?: TSelect
}

export async function findByID<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TDisableErrors extends boolean,
  TSelect extends SelectType,
>(
  sdk: PayloadSDK<T>,
  options: FindByIDOptions<T, TSlug, TDisableErrors, TSelect>,
  init?: RequestInit,
): Promise<ApplyDisableErrors<TransformCollectionWithSelect<T, TSlug, TSelect>, TDisableErrors>> {
  try {
    const response = await sdk.request({
      args: options,
      init,
      method: 'GET',
      path: `/${options.collection}/${options.id}`,
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

    throw new Error(`Error retrieving the document ${options.collection}/${options.id}`)
  }
}
