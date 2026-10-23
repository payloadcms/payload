import type { OutputInfo, Sharp, SharpOptions } from 'sharp'

import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'

import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { FileSourceToSave } from './fileSource.js'
import type { ExternalUploadSource } from './sanitizeUploadData.js'
import type { FileData, ProbedImageSize, UploadEdits } from './types.js'

import { FileRetrievalError, FileUploadError, Forbidden, MissingFile } from '../errors/index.js'
import { isNumber } from '../utilities/isNumber.js'
import { canResizeImage } from './canResizeImage.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { cropImage } from './cropImage.js'
import { getFileBuffer, getFileInput, getFileSource, replaceFileSource } from './fileSource.js'
import { getExternalFile } from './getExternalFile.js'
import { getFileByPath } from './getFileByPath.js'
import { getFileContentRequirement } from './getFileContentRequirement.js'
import { getFileFromClientUpload } from './getFileFromClientUpload.js'
import { getFileExtension, getSanitizedUploadFilename } from './getFileTypeIdentity.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName } from './getSafeFilename.js'
import { createImageSizes } from './image-resizing/createImageSizes.js'
import { isAnimatedImage } from './isAnimatedImage.js'
import { isImage } from './isImage.js'
import { isProcessableImage } from './isProcessableImage.js'
import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'
import { normalizeUploadFile, toLegacyUploadFile } from './uploadFile.js'
type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
  draft?: boolean
  externalUploadSource?: ExternalUploadSource
  isDuplicating?: boolean
  operation: 'create' | 'update'
  originalDoc?: T
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  throwOnMissingFile?: boolean
}

type Result<T> = Promise<{
  data: T
  files: FileSourceToSave[]
}>

const shouldReupload = (
  uploadEdits: undefined | UploadEdits,
  fileData: Record<string, unknown> | undefined,
) => {
  if (!fileData || !uploadEdits) {
    return false
  }

  if (uploadEdits.crop || uploadEdits.heightInPixels || uploadEdits.widthInPixels) {
    return true
  }

  // Since uploadEdits always has focalPoint, compare to the value in the data if it was changed
  if (uploadEdits.focalPoint) {
    const incomingFocalX = uploadEdits.focalPoint.x
    const incomingFocalY = uploadEdits.focalPoint.y

    const currentFocalX = 'focalX' in fileData && fileData.focalX
    const currentFocalY = 'focalY' in fileData && fileData.focalY

    const isEqual = incomingFocalX === currentFocalX && incomingFocalY === currentFocalY
    return !isEqual
  }

  return false
}

/**
 * Builds the document's file metadata and the list of files to write to disk.
 *
 * A file uploaded with `useTempFiles` enabled arrives as a temp file path instead of an
 * in-memory buffer, and that temp file can be far larger than server memory allows. To avoid
 * loading it into memory unnecessarily, this skips reading the temp file entirely when local
 * storage is disabled, and copies it straight to its destination when local storage is enabled.
 */
export const generateFileData = async <T>({
  collection: { config: collectionConfig },
  data,
  draft,
  externalUploadSource,
  isDuplicating,
  operation,
  originalDoc,
  overwriteExistingFiles,
  req,
  throwOnMissingFile,
}: Args<T>): Result<T> => {
  if (!collectionConfig.upload) {
    return {
      data,
      files: [],
    }
  }

  const { serverURL, sharp } = req.payload.config

  let file =
    !isDuplicating && req.file
      ? normalizeUploadFile(
          req.file,
          req.payload.config.upload?.useTempFiles ? 'temporary' : 'external',
        )
      : undefined

  const uploadEdits = parseUploadEditsFromReqOrIncomingData({
    data,
    isDuplicating,
    operation,
    // Only a duplication source informs edit parsing. Updates now also pass `originalDoc` so the
    // stored file can be reprocessed, and that must not change which edits are applied.
    originalDoc: isDuplicating ? originalDoc : undefined,
    req,
  })

  const {
    constructorOptions,
    disableLocalStorage,
    focalPoint: focalPointEnabled = true,
    formatOptions,
    imageSizes,
    resizeOptions,
    staticDir,
    trimOptions,
    withMetadata,
  } = collectionConfig.upload

  const staticPath = staticDir

  const incomingFileData: Document = isDuplicating ? originalDoc : data
  const fileSourceData =
    externalUploadSource ?? (operation === 'update' ? originalDoc : incomingFileData)
  let isLocalFile = false

  if (
    !file &&
    fileSourceData &&
    (externalUploadSource ||
      isDuplicating ||
      shouldReupload(uploadEdits, incomingFileData as Record<string, unknown>))
  ) {
    const { filename, url } = fileSourceData as unknown as FileData
    if (filename && (filename.includes('../') || filename.includes('..\\'))) {
      throw new Forbidden(req.t)
    }

    if ((serverURL && url?.startsWith(serverURL)) || url?.startsWith('/')) {
      isLocalFile = true
    }

    try {
      if (!externalUploadSource && !disableLocalStorage && isLocalFile) {
        // File is stored locally
        const filePath = `${staticPath}/${filename}`
        const response = await getFileByPath(filePath)
        file = response ? normalizeUploadFile(response) : undefined
        overwriteExistingFiles = true
      } else if (filename && url) {
        // File is remote
        file = normalizeUploadFile(
          await getExternalFile({
            data: fileSourceData as unknown as FileData,
            req,
            uploadConfig: collectionConfig.upload,
          }),
        )
        overwriteExistingFiles = !externalUploadSource
      }
    } catch (err: unknown) {
      throw new FileRetrievalError(req.t, err instanceof Error ? err.message : undefined)
    }
  }

  if (isDuplicating) {
    overwriteExistingFiles = false
  }

  if (!file) {
    if (throwOnMissingFile) {
      throw new MissingFile(req.t)
    }

    return {
      data: incomingFileData!,
      files: [],
    }
  }

  const detectedFileType = await checkFileRestrictions({
    collection: collectionConfig,
    file,
    req,
  })

  const shouldUseDetectedFileType =
    detectedFileType &&
    (isProcessableImage(file.mimetype) || isProcessableImage(detectedFileType.mime))

  if (shouldUseDetectedFileType && detectedFileType.mime !== file.mimetype) {
    file = { ...file, mimetype: detectedFileType.mime }
  }

  // A probe may reveal a MIME type that needs more processing than the declared type did.
  if (
    file.source.type === 'clientUpload' &&
    getFileContentRequirement({
      hasSizeEdits: Boolean(
        uploadEdits?.crop || uploadEdits?.heightInPixels || uploadEdits?.widthInPixels,
      ),
      mimeType: file.mimetype,
      uploadConfig: collectionConfig.upload,
    }) === 'full'
  ) {
    file = normalizeUploadFile(
      await getFileFromClientUpload({
        file: {
          clientUploadContext: file.clientUploadContext,
          collectionSlug: collectionConfig.slug,
          filename: file.name,
          mimeType: file.mimetype,
          size: file.size,
        },
        forceFullContent: true,
        req,
      }),
    )
    const materializedType = await checkFileRestrictions({
      collection: collectionConfig,
      file,
      req,
    })
    if (
      materializedType &&
      (isProcessableImage(file.mimetype) || isProcessableImage(materializedType.mime))
    ) {
      file = { ...file, mimetype: materializedType.mime }
    }
  }

  if (!disableLocalStorage) {
    await fs.mkdir(staticPath!, { recursive: true })
  }

  let newData = incomingFileData as T
  const filesToSave: FileSourceToSave[] = []
  const fileData: Partial<FileData> = {}
  const fileIsAnimatedType = isAnimatedImage(file.mimetype)
  const cropData =
    typeof uploadEdits === 'object' && 'crop' in uploadEdits ? uploadEdits.crop : undefined

  try {
    const fileSupportsResize = canResizeImage(file.mimetype)
    let fsSafeName: string
    let sharpFile: Sharp | undefined
    let dimensions: ProbedImageSize | undefined
    let fileBuffer!: { data: Buffer; info: OutputInfo }
    let ext
    let mime: string
    // Depends only on configured resize/format/trim options, not on whether the bytes are on
    // disk or in memory.
    const fileHasAdjustments =
      fileSupportsResize &&
      Boolean(resizeOptions || formatOptions || trimOptions || constructorOptions)

    const sharpOptions: SharpOptions = { ...constructorOptions }

    if (fileIsAnimatedType) {
      sharpOptions.animated = true
    }

    if (sharp && (fileIsAnimatedType || fileHasAdjustments)) {
      sharpFile = sharp(getFileInput(file), sharpOptions).rotate() // Auto-rotate based on EXIF data.

      if (fileHasAdjustments) {
        if (resizeOptions) {
          sharpFile = sharpFile.resize(resizeOptions)
        }
        if (formatOptions) {
          sharpFile = sharpFile.toFormat(formatOptions.format, formatOptions.options)
        }
        if (trimOptions) {
          sharpFile = sharpFile.trim(trimOptions)
        }
      }
    }

    if (fileSupportsResize || isImage(file.mimetype)) {
      dimensions = await getImageSize({ file, sharp: fileSupportsResize ? sharp : undefined })
      fileData.width = dimensions.width
      fileData.height = dimensions.height
    }

    if (sharpFile) {
      const metadata = await sharpFile.metadata()
      sharpFile = await optionallyAppendMetadata({
        req,
        sharpFile,
        withMetadata: withMetadata!,
      })
      fileBuffer = await sharpFile.toBuffer({ resolveWithObject: true })
      delete file.clientUploadContext
      ;({ ext, mime } = (await fileTypeFromBuffer(fileBuffer.data))!) // This is getting an incorrect gif height back.
      fileData.width = fileBuffer.info.width
      fileData.height = fileBuffer.info.height
      fileData.filesize = fileBuffer.info.size

      // Animated GIFs + WebP aggregate the height from every frame, so we need to use divide by number of pages
      if (metadata.pages) {
        fileData.height = fileBuffer.info.height / metadata.pages
        fileData.filesize = fileBuffer.data.length
      }
    } else {
      mime = file.mimetype
      fileData.filesize = file.size

      if (file.name.includes('.')) {
        ext = getFileExtension(getSanitizedUploadFilename(file.name))
      } else {
        ext = ''
      }
    }

    // Adjust SVG mime type. fromBuffer modifies it.
    if (mime === 'application/xml' && ext === 'svg') {
      mime = 'image/svg+xml'
    }
    fileData.mimeType = mime

    fsSafeName = getSanitizedUploadFilename(file.name, ext)

    if (!overwriteExistingFiles) {
      // Extract prefix if present (added by plugin-cloud-storage)
      const prefix = (data as Record<string, unknown>)?.prefix as string | undefined
      fsSafeName = await getSafeFileName({
        collectionSlug: collectionConfig.slug,
        desiredFilename: fsSafeName,
        prefix,
        req,
        staticPath: staticPath!,
      })
    }

    fileData.filename = fsSafeName

    let fileForResize = file

    if (cropData && fileSupportsResize && sharp) {
      const { data: croppedImage, info } = await cropImage({
        cropData,
        dimensions: dimensions!,
        file,
        heightInPixels: uploadEdits.heightInPixels!,
        req,
        sharp,
        widthInPixels: uploadEdits.widthInPixels!,
        withMetadata,
      })

      // Apply resize after cropping to ensure it conforms to resizeOptions
      if (resizeOptions && !resizeOptions.withoutEnlargement) {
        const resizedAfterCrop = await sharp(croppedImage)
          .resize({
            fit: resizeOptions?.fit || 'cover',
            height: resizeOptions?.height,
            position: resizeOptions?.position || 'center',
            width: resizeOptions?.width,
          })
          .toBuffer({ resolveWithObject: true })

        filesToSave.push({
          path: `${staticPath}/${fsSafeName}`,
          source: { type: 'buffer', buffer: resizedAfterCrop.data },
        })

        fileForResize = {
          ...fileForResize,
          size: resizedAfterCrop.info.size,
          source: { type: 'buffer', buffer: resizedAfterCrop.data },
        }

        fileData.width = resizedAfterCrop.info.width
        fileData.height = resizedAfterCrop.info.height
        if (fileIsAnimatedType) {
          const metadata = await sharpFile!.metadata()
          fileData.height = metadata.pages
            ? resizedAfterCrop.info.height / metadata.pages
            : resizedAfterCrop.info.height
        }
        fileData.filesize = resizedAfterCrop.info.size
      } else {
        // If resizeOptions is not present, just save the cropped image
        filesToSave.push({
          path: `${staticPath}/${fsSafeName}`,
          source: { type: 'buffer', buffer: croppedImage },
        })

        fileForResize = {
          ...file,
          size: info.size,
          source: { type: 'buffer', buffer: croppedImage },
        }

        fileData.width = info.width
        fileData.height = info.height
        if (fileIsAnimatedType) {
          const metadata = await sharpFile!.metadata()
          fileData.height = metadata.pages ? info.height / metadata.pages : info.height
        }
        fileData.filesize = info.size
      }

      file = await replaceFileSource(file, await getFileBuffer(fileForResize))
      fileForResize = file
      delete fileForResize.clientUploadContext
    } else if (fileBuffer?.data) {
      file = await replaceFileSource(file, fileBuffer.data)
      fileForResize = file
      filesToSave.push({
        path: `${staticPath}/${fsSafeName}`,
        source: getFileSource(file),
      })
    } else if (!disableLocalStorage) {
      // Unmodified temp files can be copied without materializing all their bytes.
      filesToSave.push({ path: `${staticPath}/${fsSafeName}`, source: getFileSource(file) })
    }

    req.file = toLegacyUploadFile(file, req.file)

    if (fileSupportsResize && (Array.isArray(imageSizes) || focalPointEnabled !== false)) {
      req.payloadUploadSizes = {}
      // Focal point adjustments
      const focalPoint =
        focalPointEnabled && uploadEdits?.focalPoint
          ? {
              x: isNumber(uploadEdits.focalPoint.x) ? Math.round(uploadEdits.focalPoint.x) : 50,
              y: isNumber(uploadEdits.focalPoint.y) ? Math.round(uploadEdits.focalPoint.y) : 50,
            }
          : undefined

      const { sizeData, sizesToSave } = await createImageSizes({
        config: collectionConfig,
        dimensions: !cropData
          ? dimensions!
          : {
              ...dimensions,
              height: fileData.height!,
              width: fileData.width!,
            },
        file: fileForResize,
        focalPoint,
        mimeType: fileData.mimeType,
        req,
        savedFilename: fsSafeName || file.name,
        sharp,
        staticPath: staticPath!,
        withMetadata,
      })

      fileData.sizes = sizeData
      fileData.focalX = focalPoint?.x
      fileData.focalY = focalPoint?.y
      filesToSave.push(...sizesToSave)
    }
  } catch (err) {
    req.payload.logger.error(err)
    throw new FileUploadError(req.t)
  }

  newData = {
    ...newData,
    ...fileData,
    ...(draft ? { _status: 'draft' } : {}),
  }

  return {
    data: newData,
    files: filesToSave,
  }
}

/**
 * Parse upload edits from req or incoming data
 */
function parseUploadEditsFromReqOrIncomingData(args: {
  data: unknown
  isDuplicating?: boolean
  operation: 'create' | 'update'
  originalDoc: unknown
  req: PayloadRequest
}): UploadEdits {
  const { data, isDuplicating, operation, originalDoc, req } = args

  // Get intended focal point change from query string or incoming data
  const uploadEdits =
    req.query?.uploadEdits && typeof req.query.uploadEdits === 'object'
      ? (req.query.uploadEdits as UploadEdits)
      : {}

  if (uploadEdits.focalPoint) {
    return uploadEdits
  }

  const incomingData = data as FileData
  const origDoc = originalDoc as FileData

  if (origDoc && 'focalX' in origDoc && 'focalY' in origDoc) {
    // If no change in focal point, return undefined.
    // This prevents a refocal operation triggered from admin, because it always sends the focal point.
    if (incomingData?.focalX === origDoc.focalX && incomingData?.focalY === origDoc.focalY) {
      return undefined!
    }

    if (isDuplicating) {
      uploadEdits.focalPoint = {
        x: incomingData?.focalX || origDoc.focalX!,
        y: incomingData?.focalY || origDoc.focalY!,
      }
      return uploadEdits
    }
  }

  if (incomingData?.focalX && incomingData?.focalY) {
    uploadEdits.focalPoint = {
      x: incomingData.focalX,
      y: incomingData.focalY,
    }
    return uploadEdits
  }

  // If no focal point is set, default to center
  if (operation === 'create') {
    uploadEdits.focalPoint = {
      x: 50,
      y: 50,
    }
  }

  return uploadEdits
}
