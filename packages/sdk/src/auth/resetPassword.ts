import type { AuthCollectionSlug, PayloadTypesShape } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromAuthSlug } from '../types.js'

export type ResetPasswordOptions<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
> = {
  collection: TSlug
  data: {
    password: string
    token: string
  }
}

export type ResetPasswordResult<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
> = {
  token?: string
  user: DataFromAuthSlug<T, TSlug>
}

export async function resetPassword<
  T extends PayloadTypesShape,
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
