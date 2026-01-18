import type {
  CollectionSlug,
  PayloadTypesShape,
  SelectType,
  TypedLocale,
  UploadCollectionSlug,
} from 'payload'

import type { PayloadSDK } from '../index.js'
import type {
  PopulateType,
  RequiredDataFromCollectionSlug,
  TransformCollectionWithSelect,
} from '../types.js'

import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js'

export type CreateOptions<
  T extends PayloadTypesShape,
  TSlug extends CollectionSlug<T>,
  TSelect extends SelectType,
> = {
  /**
   * the Collection slug to operate against.
   */
  collection: TSlug
  /**
   * The data for the document to create.
   */
  data: RequiredDataFromCollectionSlug<T, TSlug>
  /**
   * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
   */
  depth?: number
  /**
   * Create a **draft** document. [More](https://payloadcms.com/docs/versions/drafts#draft-api)
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
  locale?: 'all' | TypedLocale<T>
  /**
   * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
   */
  populate?: PopulateType<T>
  /**
   * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
   */
  select?: TSelect
}

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
