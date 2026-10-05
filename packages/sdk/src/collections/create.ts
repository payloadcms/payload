import type {
  CollectionSlug,
  LocaleDataOptions,
  PayloadTypesShape,
  SelectType,
  TypedLocale,
  UploadCollectionSlug,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type {
  PopulateType,
  RequiredDataFromCollectionSlug,
  TransformCollectionWithSelect,
} from '../types.js'

import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js'

type BaseCreateOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
  /** File Blob object or URL to the file. Only for upload collections */
  file?: TSlug extends UploadCollectionSlug<T> ? Blob | string : never
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType<T>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
}

export type CreateOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = ('_status' extends keyof T['collections'][TSlug]
  ?
      | ({ version: 'published' } & LocaleDataOptions<
          RequiredDataFromCollectionSlug<T, TSlug>,
          TypedLocale<T>
        >)
      | ({ version?: 'draft' } & LocaleDataOptions<
          DeepPartial<RequiredDataFromCollectionSlug<T, TSlug>>,
          TypedLocale<T>
        >)
  : { version?: 'published' } & LocaleDataOptions<
      RequiredDataFromCollectionSlug<T, TSlug>,
      TypedLocale<T>
    >) &
  BaseCreateOptions<T, TSlug, TSelect>

export async function create<
  T extends PayloadTypesShape,
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
