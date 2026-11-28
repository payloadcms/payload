import type { AuthCollectionSlug, PayloadTypesShape } from 'payload'

import type { PayloadSDK } from '../index.js'

export type LogoutOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
  /**
   * End every session of the user, not only the one making the request.
   */
  allSessions?: boolean
  collection: TSlug
}

export async function logout<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: LogoutOptions<T, TSlug>,
  init?: RequestInit,
): Promise<{ message: string }> {
  const response = await sdk.request({
    args: { allSessions: options.allSessions },
    init,
    method: 'POST',
    path: `/${options.collection}/logout`,
  })

  return response.json()
}
