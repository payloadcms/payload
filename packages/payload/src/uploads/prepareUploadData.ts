import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'

import { canResizeImage } from './canResizeImage.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { getSanitizedUploadFilename } from './getFileTypeIdentity.js'
import { getImageSize } from './getImageSize.js'
import { isProcessableImage } from './isProcessableImage.js'
import { resolveTransformStateWrite } from './transformState/resolveTransformStateWrite.js'

/** Expose source metadata to hooks without running transformers or writing files. */
export async function prepareUploadData<T>({
  collection,
  data,
  isDuplicating = false,
  originalDoc,
  req,
}: {
  collection: SanitizedCollectionConfig
  data: T
  isDuplicating?: boolean
  originalDoc?: Document
  req: PayloadRequest
}): Promise<T> {
  if (!collection.upload) {
    return data
  }

  data = (data ?? {}) as T

  const file = isDuplicating ? undefined : req.file
  const { value } = resolveTransformStateWrite({
    data,
    isReplacingOriginal: Boolean(file),
    originalDoc,
  })
  const candidate =
    file || Object.prototype.hasOwnProperty.call(data, '_transforms')
      ? { ...data, _transforms: value }
      : data

  if (!file) {
    return candidate
  }

  const detectedType = await checkFileRestrictions({ collection, file, req })
  const mimeType =
    detectedType && (isProcessableImage(file.mimetype) || isProcessableImage(detectedType.mime))
      ? detectedType.mime
      : file.mimetype
  const resolvedFile = { ...file, mimetype: mimeType }
  let dimensions: { height: number; width: number } | undefined

  if (canResizeImage(mimeType)) {
    try {
      dimensions = await getImageSize({ file: resolvedFile })
    } catch {
      // An unrecognized image has no known bounds for hook-time validation.
    }
  }

  return {
    ...candidate,
    ...dimensions,
    filename: getSanitizedUploadFilename(file.name),
    filesize: file.size,
    mimeType,
    original: {
      ...dimensions,
      filename: getSanitizedUploadFilename(file.name),
      filesize: file.size,
      mimeType,
    },
  }
}
