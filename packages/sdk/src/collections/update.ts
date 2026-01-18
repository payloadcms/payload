import type {
  CollectionSlug,
  PayloadTypesShape,
  SelectType,
  TypedLocale,
  UploadCollectionSlug,
  Where,
} from '@ruya.sa/payload'
import type { DeepPartial } from 'ts-essentials'

import type { PayloadSDK } from '../index.js'
import type {
  BulkOperationResult,
  PopulateType,
  RequiredDataFromCollectionSlug,
  SelectFromCollectionSlug,
  TransformCollectionWithSelect,
} from '../types.js'

import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js'

export type UpdateBaseOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  /**
   * Whether the current update should be marked as from autosave.
   * `versions.drafts.autosave` should be specified.
   */
  autosave?: boolean
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * The document / documents data to update.
   */
  data: DeepPartial<RequiredDataFromCollectionSlug<T, TSlug>>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Update documents to a draft.
   */
  draft?: boolean
  /**
   * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
   */
  fallbackLocale?: false | TypedLocale<T>
  /** File Blob object or URL to the file. Only for upload collections */
  file?: TSlug extends UploadCollectionSlug<T> ? Blob | string : never
  /**
   * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
   */
  locale?: TypedLocale<T>
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType<T>
  /**
   * Publish the document / documents with a specific locale.
   */
  publishSpecificLocale?: string
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
}

export type UpdateByIDOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id: number | string
  limit?: never
  where?: never
} & UpdateBaseOptions<T, TSlug, TSelect>

export type UpdateManyOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = {
  id?: never
  limit?: number
  where: Where
} & UpdateBaseOptions<T, TSlug, TSelect>

export type UpdateOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectFromCollectionSlug<T, TSlug>,
> = UpdateByIDOptions<T, TSlug, TSelect> | UpdateManyOptions<T, TSlug, TSelect>

export async function update<
  T extends PayloadTypesShape,
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
