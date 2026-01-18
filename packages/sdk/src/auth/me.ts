import type { AuthCollectionSlug, PayloadTypesShape } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromAuthSlug } from '../types.js'

export type MeOptions<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
  collection: TSlug
}

export type MeResult<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>> = {
  collection?: TSlug
  exp?: number
  message: string
  strategy?: string
  token?: string
  user: DataFromAuthSlug<T, TSlug>
}

export async function me<T extends PayloadTypesShape, TSlug extends AuthCollectionSlug<T>>(
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
