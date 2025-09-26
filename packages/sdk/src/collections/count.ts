import type { Where } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { CollectionSlug, PayloadGeneratedTypes, TypedLocale } from '../types.js'

export type CountOptions<T extends PayloadGeneratedTypes, TSlug extends CollectionSlug<T>> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   *  Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: 'all' | TypedLocale<T>
  /**
   * A filter [query](https://payloadcms.com/docs/queries/overview)
   */
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
