import type { TypeWithVersion } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type RestoreGlobalVersionByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
> = {
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  id: number | string
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  slug: TSlug
}

export async function restoreGlobalVersion<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: RestoreGlobalVersionByIDOptions<T, TSlug>,
  init?: RequestInit,
): Promise<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'POST',
    path: `/globals/${options.slug}/versions/${options.id}`,
  })

  const { doc } = await response.json()

  return doc
}
