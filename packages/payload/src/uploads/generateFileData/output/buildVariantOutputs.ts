import { fileTypeFromBuffer } from 'file-type'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { UploadTransformation } from '../../transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave } from '../../types.js'

import { getUnplannedSafeFileName } from '../../getSafeFilename.js'
import { isProcessableImage } from '../../isProcessableImage.js'
import { isRequestTimeFile } from '../../isRequestTimeFile.js'
import { parseFilename } from '../../parseFilename.js'
import { probeImageSize } from '../../probeImageSize.js'
import { generateImageSizeFilename } from '../utils/generateImageSizeFilename.js'

/**
 * The saved entry and the file to store for each size that the upload bridge built. A size with
 * the same bytes as another planned size shares its file.
 */
export async function buildVariantOutputs({
  collection,
  currentFileData,
  excludeDocumentID,
  filename,
  mainMimeType,
  objectKey,
  originalFilename,
  prefix,
  req,
  shouldStageCloudFiles,
  sizeResults,
  storedPrefix,
}: {
  collection: SanitizedCollectionConfig
  /** The file data the document has before this operation. */
  currentFileData?: FileData
  /** This document's ID, when its own files cannot collide with the new names. */
  excludeDocumentID?: number | string
  /** The main file's name. Size names are based on it. */
  filename: string
  mainMimeType: string
  objectKey?: string
  originalFilename?: string
  /** The prefix that names are checked against. */
  prefix?: string
  req: PayloadRequest
  shouldStageCloudFiles: boolean
  sizeResults: UploadTransformation[]
  /** The prefix saved on each size entry. */
  storedPrefix?: string
}): Promise<{
  files: FileToSave[]
  /** The bytes of each built size, for `req.payloadUploadSizes`. */
  sizeBuffers: Record<string, Buffer>
  variants: FileSizes
}> {
  const { disableLocalStorage, staticDir: staticPath } = collection.upload
  const files: FileToSave[] = []
  const sizeBuffers: Record<string, Buffer> = {}
  const variants: FileSizes = {}
  const { name: baseName, ext: baseExt } = parseFilename(filename)
  const plannedNames = new Set([filename, originalFilename])
  const plannedSizeBuffers = new Map<string, Buffer>()

  for (const result of sizeResults) {
    const sizeName = result.fieldPath.slice('variants.'.length)
    const savedEntry = currentFileData?.variants?.[sizeName]
    // An update merges into the saved entry, so a new entry must clear the marker an earlier owner
    // wrote when it built the size at request time, and replace the earlier storage fields.
    const replacedEntryFields = {
      ...(isRequestTimeFile({ entry: savedEntry }) ? { _stored: null } : {}),
      _objectKey: objectKey,
      prefix: storedPrefix,
    }

    if (!result.file) {
      variants[sizeName] = {
        ...(savedEntry ? replacedEntryFields : {}),
        filename: null,
        filesize: null,
        height: null,
        mimeType: null,
        url: null,
        width: null,
      }
      continue
    }

    const sizeBuffer = Buffer.from(await result.file.arrayBuffer())
    const sizeTypeResult = await fileTypeFromBuffer(sizeBuffer)
    const sizeExt = sizeTypeResult?.ext || baseExt
    const sizeMimeType = sizeTypeResult?.mime || result.mimeType || mainMimeType

    sizeBuffers[sizeName] = sizeBuffer

    const imageSizeConfig = collection.upload.variants?.find(
      (imageSize) => imageSize.name === sizeName,
    )

    const size = getVariantSize({ buffer: sizeBuffer, mimeType: sizeMimeType, result })

    let imageName = !size
      ? `${baseName}-${sizeName}${sizeExt ? `.${sizeExt}` : ''}`
      : imageSizeConfig?.generateImageName
        ? imageSizeConfig.generateImageName({
            extension: sizeExt,
            height: size.height,
            originalName: baseName,
            sizeName,
            width: size.width,
          })
        : generateImageSizeFilename({
            extension: sizeExt,
            height: size.height,
            outputImageName: baseName,
            width: size.width,
          })

    if (!disableLocalStorage || shouldStageCloudFiles) {
      imageName = await getUnplannedSafeFileName({
        // A size with the same bytes as a planned file can share that file's name.
        canUseName: (name) =>
          Boolean(plannedSizeBuffers.get(name)?.equals(sizeBuffer)) || !plannedNames.has(name),
        collectionSlug: collection.slug,
        desiredFilename: imageName,
        excludeDocumentID,
        prefix,
        req,
        staticPath: disableLocalStorage ? undefined : staticPath!,
      })
      plannedNames.add(imageName)
    }

    variants[sizeName] = {
      ...replacedEntryFields,
      filename: imageName,
      filesize: sizeBuffer.length,
      height: size?.height ?? null,
      mimeType: sizeMimeType,
      url: null,
      width: size?.width ?? null,
    }

    if (!plannedSizeBuffers.has(imageName)) {
      plannedSizeBuffers.set(imageName, sizeBuffer)
      files.push({
        buffer: sizeBuffer,
        path: `${staticPath}/${imageName}`,
        role: { type: 'size', sizeKey: sizeName },
      })
    }
  }

  return { files, sizeBuffers, variants }
}

/**
 * The variant's size: the one its maker gave, or else the one core measures when the file is an
 * image type core can read. `undefined` when neither is known, so the variant is saved with no
 * size and named without one.
 */
function getVariantSize({
  buffer,
  mimeType,
  result,
}: {
  buffer: Buffer
  mimeType: string
  result: UploadTransformation
}): { height: number; width: number } | undefined {
  if (result.height !== undefined && result.width !== undefined) {
    return { height: result.height, width: result.width }
  }

  if (!isProcessableImage(mimeType)) {
    return undefined
  }

  try {
    const { height, width } = probeImageSize(buffer)

    return { height, width }
  } catch {
    // Not a readable image, so the size stays unknown.
    return undefined
  }
}
