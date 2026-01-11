import type { AuthCollectionSlug, BaseGeneratedTypes, TypedAuthOperations } from 'payload'

import type { PayloadSDK } from '../index.js'

export type ForgotPasswordOptions<
  T extends BaseGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
> = {
  collection: TSlug
  data: {
    disableEmail?: boolean
    expiration?: number
  } & Omit<TypedAuthOperations<T>[TSlug]['forgotPassword'], 'password'>
}

export async function forgotPassword<
  T extends BaseGeneratedTypes,
  TSlug extends AuthCollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: ForgotPasswordOptions<T, TSlug>,
  init?: RequestInit,
): Promise<{ message: string }> {
  const response = await sdk.request({
    init,
    json: options.data,
    method: 'POST',
    path: `/${options.collection}/forgot-password`,
  })

  return response.json()
}
