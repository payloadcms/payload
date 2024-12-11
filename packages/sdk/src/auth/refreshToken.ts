import type { PayloadSDK } from '../index.js'
import type { AuthCollectionSlug, DataFromCollectionSlug, PayloadGeneratedTypes } from '../types.js'

export type RefreshOptions<T extends PayloadGeneratedTypes, TSlug extends AuthCollectionSlug<T>> = {
  collection: TSlug
}

export type RefreshResult<T extends PayloadGeneratedTypes, TSlug extends AuthCollectionSlug<T>> = {
  exp: number
  refreshedToken: string
  setCookie?: boolean
  strategy?: string
  // @ts-expect-error auth collection and user collection
  user: DataFromCollectionSlug<T, TSlug>
}

export async function refreshToken<
  T extends PayloadGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: RefreshOptions<T, TSlug>,
  init?: RequestInit,
): Promise<RefreshResult<T, TSlug>> {
  const response = await sdk.request({
    init,
    method: 'POST',
    path: `/${options.collection}/refresh-token`,
  })

  return response.json()
}
