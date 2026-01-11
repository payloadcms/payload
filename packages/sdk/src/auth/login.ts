import type { AuthCollectionSlug, BaseGeneratedTypes, TypedAuthOperations } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromCollectionSlug } from '../types.js'

export type LoginOptions<T extends BaseGeneratedTypes, TSlug extends AuthCollectionSlug<T>> = {
  collection: TSlug
  data: TypedAuthOperations<T>[TSlug]['login']
}

export type LoginResult<T extends BaseGeneratedTypes, TSlug extends AuthCollectionSlug<T>> = {
  exp?: number
  message: string
  token?: string
  // @ts-expect-error auth collection and user collection
  user: DataFromCollectionSlug<T, TSlug>
}

export async function login<T extends BaseGeneratedTypes, TSlug extends AuthCollectionSlug<T>>(
  sdk: PayloadSDK<T>,
  options: LoginOptions<T, TSlug>,
  init?: RequestInit,
): Promise<LoginResult<T, TSlug>> {
  const response = await sdk.request({
    init,
    json: options.data,
    method: 'POST',
    path: `/${options.collection}/login`,
  })

  return response.json()
}
