import type { AuthCollectionSlug, PayloadTypesShape, ReadVersion } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { CollectionVersionOptions, TransformAuthWithVersion } from '../types.js'

export type MeOptions<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
  TVersion extends ReadVersion | undefined = undefined,
> = {
  collection: TSlug
  version?: TVersion
} & CollectionVersionOptions<TSlug>

export type MeResult<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
  TVersion extends ReadVersion | undefined = undefined,
> = {
  collection?: TSlug
  exp?: number
  message: string
  token?: string
  user: { _strategy?: string } & TransformAuthWithVersion<T, TSlug, TVersion>
}

export async function me<
  T extends PayloadTypesShape,
  TSlug extends AuthCollectionSlug<T>,
  TVersion extends ReadVersion | undefined = undefined,
>(
  sdk: PayloadSDK<T>,
  options: MeOptions<T, TSlug, TVersion>,
  init?: RequestInit,
): Promise<MeResult<T, TSlug, TVersion>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/${options.collection}/me`,
  })

  return response.json()
}
