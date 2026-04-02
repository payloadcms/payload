import type { AuthCollectionSlug, PayloadTypesShape } from 'payload'

import type { PayloadSDK } from '../index.js'

export type ForgotPasswordOptions<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
> = {
  collection: TSlug
  data: {
    disableEmail?: boolean
    email: string
    expiration?: number
  }
}

export async function forgotPassword<
  T extends PayloadTypesShape,
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
