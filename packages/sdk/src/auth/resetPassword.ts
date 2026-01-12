import type { PayloadSDK } from '../index.js'
import type { AuthCollectionSlug, DataFromCollectionSlug, PayloadGeneratedTypes } from '../types.js'

export type ResetPasswordOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
> = {
  collection: TSlug
  data: {
    password: string
    token: string
  }
}

export type ResetPasswordResult<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
> = {
  token?: string
  // @ts-expect-error auth collection and user collection
  user: DataFromCollectionSlug<T, TSlug>
}

export async function resetPassword<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: ResetPasswordOptions<T, TSlug>,
  init?: RequestInit,
): Promise<ResetPasswordResult<T, TSlug>> {
  const response = await sdk.request({
    init,
    json: options.data,
    method: 'POST',
    path: `/${options.collection}/reset-password`,
  })

  return response.json()
}
