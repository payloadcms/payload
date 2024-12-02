import type { PayloadSDK } from '../index.js'
import type { AuthCollectionSlug, PayloadGeneratedTypes } from '../types.js'

export type VerifyEmailOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
> = {
  collection: TSlug
  token: string
}

export async function verifyEmail<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: VerifyEmailOptions<T, TSlug>,
  init?: RequestInit,
): Promise<{ message: string }> {
  const response = await sdk.request({
    init,
    method: 'POST',
    path: `/${options.collection}/verify/${options.token}`,
  })

  return response.json()
}
