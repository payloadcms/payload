import type { SelectType } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  SelectFromGlobalSlug,
  TransformGlobalWithSelect,
  TypedLocale,
} from '../types.js'

export type FindGlobalOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectType,
> = {
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  select?: TSelect
  slug: TSlug
}

export async function findGlobal<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectFromGlobalSlug<T, TSlug>,
>(
  sdk: PayloadSDK<T>,
  options: FindGlobalOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<TransformGlobalWithSelect<T, TSlug, TSelect>> {
  const response = await sdk.request({
    args: options,
    init,
    method: 'GET',
    path: `/globals/${options.slug}`,
  })

  return response.json()
}
