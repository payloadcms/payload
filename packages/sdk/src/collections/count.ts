import type { Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { CollectionSlug, PayloadGeneratedTypes, TypedLocale } from '../types.js'

export type CountOptions<T extends PayloadGeneratedTypes, TSlug extends CollectionSlug<T>> = {
  collection: TSlug
  locale?: 'all' | TypedLocale<T>
  where?: Where
}

export async function count<T extends PayloadGeneratedTypes, TSlug extends CollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: CountOptions<T, TSlug>,
  init?: RequestInit,
): Promise<{ totalDocs: number }> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/${options.collection}/count`,
  })

  return response.json()
}
