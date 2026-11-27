import type { CollectionSlug, PayloadTypesShape, SanitizedCollectionPermission } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type { DataFromCollectionSlug } from '../types.js'

export type DocAccessOptions<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * Data to evaluate access against, for access functions that read `data`.
   */
  data?: DeepPartial<DataFromCollectionSlug<T, TSlug>>
  /**
   * The ID of the document to check. Omit it to check access for a new document.
   */
  id?: number | string
}

export async function docAccess<T extends PayloadTypesShape, TSlug extends CollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: DocAccessOptions<T, TSlug>,
  init?: RequestInit,
): Promise<SanitizedCollectionPermission> {
  const response = await sdk.request({
    init,
    json: options.data ?? {},
    method: 'POST',
    path: `/${options.collection}/access${options.id === undefined ? '' : `/${encodeURIComponent(String(options.id))}`}`,
  })

  return response.json()
}
