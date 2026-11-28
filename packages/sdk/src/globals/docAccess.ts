import type { GlobalSlug, PayloadTypesShape, SanitizedGlobalPermission } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type { DataFromGlobalSlug } from '../types.js'

export type DocAccessGlobalOptions<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>> = {
  /**
   * Data to evaluate access against, for access functions that read `data`.
   */
  data?: DeepPartial<DataFromGlobalSlug<T, TSlug>>
  /**
   * the Global slug to operate against.
   */
  slug: TSlug
}

export async function docAccessGlobal<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>>(
  sdk: PayloadSDK<T>,
  options: DocAccessGlobalOptions<T, TSlug>,
  init?: RequestInit,
): Promise<SanitizedGlobalPermission> {
  const response = await sdk.request({
    init,
    json: options.data ?? {},
    method: 'POST',
    path: `/globals/${options.slug}/access`,
  })

  return response.json()
}
