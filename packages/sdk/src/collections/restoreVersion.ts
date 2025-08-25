import type { PayloadSDK } from '../index.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type RestoreVersionByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
> = {
  collection: TSlug
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  id: number | string
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
}

export async function restoreVersion<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: RestoreVersionByIDOptions<T, TSlug>,
  init?: RequestInit,
): Promise<DataFromCollectionSlug<T, TSlug>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'POST',
    path: `/${options.collection}/versions/${options.id}`,
  })

  return response.json()
}
