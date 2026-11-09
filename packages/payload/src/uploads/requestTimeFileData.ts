import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { PixelCrop } from './transformState/cropUnits.js'
import type { FileSizes, OriginalFileData } from './types.js'

import { getFileExtension } from './getFileTypeIdentity.js'
import { getUnplannedSafeFileName } from './getSafeFilename.js'
import { parseFilename } from './parseFilename.js'

/** The default entry describes the saved crop; its bytes are built from the original on request. */
export function getRequestTimeDefaultFileData({
  original,
  transforms,
}: {
  original: OriginalFileData
  transforms: Document['_transforms']
}) {
  const crop = (transforms as { crop?: PixelCrop } | null | undefined)?.crop

  return {
    _objectKey: null,
    _stored: false,
    filename: original.filename,
    filesize: null,
    height: crop?.height ?? original.height ?? null,
    mimeType: original.mimeType,
    prefix: original.prefix,
    url: null,
    width: crop?.width ?? original.width ?? null,
  }
}

/** Generate names from the current size declarations, without retaining old virtual metadata. */
export async function getRequestTimeVariants({
  collection,
  documentID,
  filename,
  original,
  prefix,
  req,
  staticPath,
}: {
  collection: SanitizedCollectionConfig
  documentID?: number | string
  filename: string
  original: OriginalFileData
  prefix?: string
  req: PayloadRequest
  staticPath?: string
}): Promise<FileSizes> {
  const { name: baseName } = parseFilename(filename)
  const baseExt = getFileExtension(original.filename)
  const plannedNames = new Set([filename, original.filename])
  const variants: FileSizes = {}

  for (const { name: variantName } of collection.upload.variants ?? []) {
    const variantFilename = await getUnplannedSafeFileName({
      canUseName: (name) => !plannedNames.has(name),
      collectionSlug: collection.slug,
      desiredFilename: `${baseName}-${variantName}${baseExt ? `.${baseExt}` : ''}`,
      excludeDocumentID: documentID,
      prefix,
      req,
      staticPath,
    })
    plannedNames.add(variantFilename)
    variants[variantName] = {
      _stored: false,
      filename: variantFilename,
      filesize: null,
      height: null,
      mimeType: null,
      prefix: original.prefix,
      url: null,
      width: null,
    }
  }

  return variants
}
