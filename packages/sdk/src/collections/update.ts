import type { SelectType, Where } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type {
  BulkOperationResult,
  CollectionSlug,
  PayloadGeneratedTypes,
  PopulateType,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
  TransformCollectionWithSelect,
  TypedLocale,
} from '../types.js'

import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js'

export type UpdateBaseOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  autosave?: boolean
  collection: TSlug
  data: DeepPartial<RequiredDataFromCollectionSlug<T, TSlug>>
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  file?: File | string
  filePath?: string
  locale?: TypedLocale<T>
  populate?: PopulateType<T>
  publishSpecificLocale?: string
  select?: TSelect
}

export type UpdateByIDOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id: number | string
  limit?: never
  where?: never
} & UpdateBaseOptions<T, TSlug, TSelect>

export type UpdateManyOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id?: never
  limit?: number
  where: Where
} & UpdateBaseOptions<T, TSlug, TSelect>

export type UpdateOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = UpdateByIDOptions<T, TSlug, TSelect> | UpdateManyOptions<T, TSlug, TSelect>

export async function update<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
>(
  sdk: PayloadSDK<T>,
  options: UpdateOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<
  BulkOperationResult<T, TSlug, TSelect> | TransformCollectionWithSelect<T, TSlug, TSelect>
> {
  let file: Blob | undefined = undefined

  if (options.file) {
    file = await resolveFileFromOptions(options.file)
  }

  const response = await sdk.request({
    args: options,
    file,
    init,
    json: options.data,
    method: 'PATCH',
    path: `/${options.collection}${options.id ? `/${options.id}` : ''}`,
  })

  const json = await response.json()

  if (options.id) {
    return json.doc
  }

  return json
}
