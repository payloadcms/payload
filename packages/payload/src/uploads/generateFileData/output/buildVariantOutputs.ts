import { fileTypeFromBuffer } from 'file-type'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { PreparedUploadTransformation } from '../../transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave } from '../../types.js'

import { getUnplannedSafeFileName } from '../../getSafeFilename.js'
import { isRequestTimeFile } from '../../isRequestTimeFile.js'
import { parseFilename } from '../../parseFilename.js'
import { generateImageSizeFilename } from '../utils/generateImageSizeFilename.js'

/**
 * The saved entry and the file to store for each size that the Sharp bridge built. A size with
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
  sizeResults: PreparedUploadTransformation[]
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

    if (!result.file) {
      variants[sizeName] = {
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

    let imageName = imageSizeConfig?.generateImageName
      ? imageSizeConfig.generateImageName({
          extension: sizeExt,
          height: result.height!,
          originalName: baseName,
          sizeName,
          width: result.width!,
        })
      : generateImageSizeFilename({
          extension: sizeExt,
          height: result.height!,
          outputImageName: baseName,
          width: result.width!,
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
      // An update merges into the saved entry, so a size that is stored again must clear the
      // marker an earlier owner wrote when it built the size at request time.
      ...(isRequestTimeFile({ entry: currentFileData?.variants?.[sizeName] })
        ? { _stored: null }
        : {}),
      _objectKey: objectKey,
      filename: imageName,
      filesize: sizeBuffer.length,
      height: result.height!,
      mimeType: sizeMimeType,
      prefix: storedPrefix,
      url: null,
      width: result.width!,
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
