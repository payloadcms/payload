import type { ApplyDisableErrors, SelectType, TypeWithVersion } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  TypedLocale,
} from '../types.js'

export type FindGlobalVersionByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TDisableErrors extends boolean,
> = {
  depth?: number
  disableErrors?: TDisableErrors
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  id: number | string
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  select?: SelectType
  slug: TSlug
}

export async function findGlobalVersionByID<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TDisableErrors extends boolean,
>(
  sdk: PayloadSDK<T>,
  options: FindGlobalVersionByIDOptions<T, TSlug, TDisableErrors>,
  init?: RequestInit,
): Promise<ApplyDisableErrors<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>, TDisableErrors>> {
  try {
    const response = await sdk.request({
      args: options,
      init,
      method: 'GET',
      path: `/globals/${options.slug}/versions/${options.id}`,
    })

    if (response.ok) {
      return response.json()
    } else {
      throw new Error()
    }
  } catch {
    if (options.disableErrors) {
      // @ts-expect-error generic nullable
      return null
    }

    throw new Error(`Error retrieving the version document ${options.slug}/${options.id}`)
  }
}
