import type { PayloadTypesShape, SanitizedPermissions } from 'payload'

import type { PayloadSDK } from '../index.js'

/**
 * `access` takes no options yet. The object is there so options can be added without a breaking change.
 */
export type AccessOptions = Record<string, never>

export async function access<T extends PayloadTypesShape>(
  sdk: PayloadSDK<T>,
  _options: AccessOptions,
  init?: RequestInit,
): Promise<SanitizedPermissions> {
  const response = await sdk.request({
    init,
    method: 'GET',
    path: '/access',
  })

  return response.json()
}
