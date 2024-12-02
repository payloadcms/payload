import type { SelectType } from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  CollectionSlug,
  PayloadGeneratedTypes,
  PopulateType,
  RequiredDataFromCollectionSlug,
  TransformCollectionWithSelect,
  TypedLocale,
  UploadCollectionSlug,
} from '../types.js'

import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js'

export type CreateOptions<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  collection: TSlug
  data: RequiredDataFromCollectionSlug<T, TSlug>
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale<T>
  /** File Blob object or URL to the file. Only for upload collections */
  file?: TSlug extends UploadCollectionSlug<T> ? Blob | string : never
  locale?: 'all' | TypedLocale<T>
  populate?: PopulateType<T>
  select?: TSelect
}

export async function create<
  T extends PayloadGeneratedTypes,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
>(
  sdk: PayloadSDK<T>,
  options: CreateOptions<T, TSlug, TSelect>,
  init?: RequestInit,
): Promise<TransformCollectionWithSelect<T, TSlug, TSelect>> {
  let file: Blob | undefined = undefined

  if (options.file) {
    file = await resolveFileFromOptions(options.file)
  }

  const response = await sdk.request({
    args: options,
    file,
    init,
    json: options.data,
    method: 'POST',
    path: `/${options.collection}`,
  })

  const json = await response.json()

  return json.doc
}
