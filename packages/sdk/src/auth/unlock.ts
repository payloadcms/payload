import type { AuthCollectionSlug, PayloadTypesShape } from 'payload'

import type { PayloadSDK } from '../index.js'

export type UnlockOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
  collection: TSlug
  /**
   * The user to unlock, by `email`, or by `username` when the collection logs in with usernames.
   */
  data: { email: string } | { username: string }
}

export async function unlock<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: UnlockOptions<T, TSlug>,
  init?: RequestInit,
): Promise<{ message: string }> {
  const response = await sdk.request({
    init,
    json: options.data,
    method: 'POST',
    path: `/${options.collection}/unlock`,
  })

  return response.json()
}
