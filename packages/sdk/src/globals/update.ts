import type { SelectType } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadGeneratedTypes,
  PopulateType,
  SelectFromGlobalSlug,
  TransformGlobalWithSelect,
  TypedLocale,
} from '../types.js'

export type UpdateGlobalOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectType,
> = {
  data: DeepPartial<Omit<DataFromGlobalSlug<T, TSlug>, 'id'>>
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  publishSpecificLocale?: TypedLocale<T>
  select?: TSelect
  slug: TSlug
}

export async function updateGlobal<
  T extends PayloadGeneratedTypes,
  TSlug extends GlobalSlug<T>,
  TSelect extends SelectFromGlobalSlug<T, TSlug>,
>(
  sdk: PayloadSDK<T>,
  options: UpdateGlobalOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<TransformGlobalWithSelect<T, TSlug, TSelect>> {
  const response = await sdk.request({
    args: options,
    init,
    json: options.data,
    method: 'POST',
    path: `/globals/${options.slug}`,
  })

  const { result } = await response.json()

  return result
}
