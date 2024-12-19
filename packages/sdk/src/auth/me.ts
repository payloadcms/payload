import type { PayloadSDK } from '../index.js'
import type { AuthCollectionSlug, DataFromCollectionSlug, PayloadGeneratedTypes } from '../types.js'

export type MeOptions<T extends PayloadGeneratedTypes, TSlug extends AuthCollectionSlug<T>> = {
  collection: TSlug
}

export type MeResult<T extends PayloadGeneratedTypes, TSlug extends AuthCollectionSlug<T>> = {
  collection?: TSlug
  exp?: number
  message: string
  strategy?: string
  token?: string
  // @ts-expect-error auth collection and user collection
  user: DataFromCollectionSlug<T, TSlug>
}

export async function me<T extends PayloadGeneratedTypes, TSlug extends AuthCollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: MeOptions<T, TSlug>,
  init?: RequestInit,
): Promise<MeResult<T, TSlug>> {
  const response = await sdk.request({
    init,
    method: 'GET',
    path: `/${options.collection}/me`,
  })

  return response.json()
}
