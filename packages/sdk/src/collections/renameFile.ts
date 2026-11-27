import type { PayloadTypesShape, UploadCollectionSlug } from 'payload'

import type { PayloadSDK } from '../index.js'
import type { DataFromCollectionSlug } from '../types.js'

export type RenameFileOptions<
  T extends PayloadTypesShape,
  TSlug extends UploadCollectionSlug<T>,
> = {
  /**
   * the upload Collection slug to operate against.
   */
  collection: TSlug
  /**
   * Rename the file on the newest draft instead of the published document.
   */
  draft?: boolean
  /**
   * The new filename, including its extension.
   */
  filename: string
  /**
   * The ID of the upload document.
   */
  id: number | string
}

export async function renameFile<
  T extends PayloadTypesShape,
  TSlug extends UploadCollectionSlug<T>,
>(
  sdk: PayloadSDK<T>,
  options: RenameFileOptions<T, TSlug>,
  init?: RequestInit,
): Promise<DataFromCollectionSlug<T, TSlug>> {
  const response = await sdk.request({
    init,
    json: { draft: options.draft, filename: options.filename },
    method: 'POST',
    path: `/${options.collection}/${options.id}/rename`,
  })

  const json = await response.json()

  return json.doc
}
