import type { AuthCollectionSlug, CollectionSlug, PayloadTypesShape } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromCollectionSlug } from '../types.js'

export type LoginOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
  collection: TSlug
  data: {
    email: string
    password: string
  }
}

export type LoginResult<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
  exp?: number
  message: string
  token?: string
  user: DataFromCollectionSlug<T, CollectionSlug<T> & TSlug>
}

export async function login<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(
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
