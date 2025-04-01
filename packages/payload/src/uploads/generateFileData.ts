// @ts-strict-ignore
import type { OutputInfo, Sharp, SharpOptions } from 'sharp'

import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import sanitize from 'sanitize-filename'

import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileData, FileToSave, ProbedImageSize, UploadEdits } from './types.js'

import { FileRetrievalError, FileUploadError, MissingFile } from '../errors/index.js'
import { canResizeImage } from './canResizeImage.js'
import { cropImage } from './cropImage.js'
import { getExternalFile } from './getExternalFile.js'
import { getFileByPath } from './getFileByPath.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName } from './getSafeFilename.js'
import { resizeAndTransformImageSizes } from './imageResizer.js'
import { isImage } from './isImage.js'
import { optionallyAppendMetadata } from './optionallyAppendMetadata.js'

type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
  isDuplicating?: boolean
  operation: 'create' | 'update'
  originalDoc?: T
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  throwOnMissingFile?: boolean
}

type Result<T> = Promise<{
  data: T
  files: FileToSave[]
}>

export const generateFileData = async <T>({
  collection: { config: collectionConfig },
  data,
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

  const { sharp } = req.payload.config

  let file = req.file

  const uploadEdits = parseUploadEditsFromReqOrIncomingData({
    data,
    isDuplicating,
    operation,
    originalDoc,
    req,
  })

  const {
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

  const incomingFileData = isDuplicating ? originalDoc : data

  if (!file && uploadEdits && incomingFileData) {
    const { filename, url } = incomingFileData as FileData

    try {
      if (url && url.startsWith('/') && !disableLocalStorage) {
        const filePath = `${staticPath}/${filename}`
        const response = await getFileByPath(filePath)
        file = response
        overwriteExistingFiles = true
      } else if (filename && url) {
        file = await getExternalFile({
          data: incomingFileData as FileData,
          req,
          uploadConfig: collectionConfig.upload,
        })
        overwriteExistingFiles = true
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
      data,
      files: [],
    }
  }

  if (!disableLocalStorage) {
    await fs.mkdir(staticPath, { recursive: true })
  }

  let newData = data
  const filesToSave: FileToSave[] = []
  const fileData: Partial<FileData> = {}
  const fileIsAnimatedType = ['image/avif', 'image/gif', 'image/webp'].includes(file.mimetype)
  const cropData =
    typeof uploadEdits === 'object' && 'crop' in uploadEdits ? uploadEdits.crop : undefined

  try {
    const fileSupportsResize = canResizeImage(file.mimetype)
    let fsSafeName: string
    let sharpFile: Sharp | undefined
    let dimensions: ProbedImageSize | undefined
    let fileBuffer: { data: Buffer; info: OutputInfo }
    let ext
    let mime: string
    const fileHasAdjustments =
      fileSupportsResize &&
      Boolean(resizeOptions || formatOptions || trimOptions || file.tempFilePath)

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) {
      sharpOptions.animated = true
    }

    if (sharp && (fileIsAnimatedType || fileHasAdjustments)) {
      if (file.tempFilePath) {
        sharpFile = sharp(file.tempFilePath, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
      } else {
        sharpFile = sharp(file.data, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
      }

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
      dimensions = await getImageSize(file)
      fileData.width = dimensions.width
      fileData.height = dimensions.height
    }

    if (sharpFile) {
      const metadata = await sharpFile.metadata()
      sharpFile = await optionallyAppendMetadata({
        req,
        sharpFile,
        withMetadata,
      })
      fileBuffer = await sharpFile.toBuffer({ resolveWithObject: true })
      ;({ ext, mime } = await fileTypeFromBuffer(fileBuffer.data)) // This is getting an incorrect gif height back.
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
        ext = file.name.split('.').pop().split('?')[0]
      } else {
        ext = ''
      }
    }

    // Adjust SVG mime type. fromBuffer modifies it.
    if (mime === 'application/xml' && ext === 'svg') {
      mime = 'image/svg+xml'
    }
    fileData.mimeType = mime

    const baseFilename = sanitize(file.name.substring(0, file.name.lastIndexOf('.')) || file.name)
    fsSafeName = `${baseFilename}${ext ? `.${ext}` : ''}`

    if (!overwriteExistingFiles) {
      fsSafeName = await getSafeFileName({
        collectionSlug: collectionConfig.slug,
        desiredFilename: fsSafeName,
        req,
        staticPath,
      })
    }

    fileData.filename = fsSafeName
    let fileForResize = file

    if (cropData && sharp) {
      const { data: croppedImage, info } = await cropImage({
        cropData,
        dimensions,
        file,
        heightInPixels: uploadEdits.heightInPixels,
        req,
        sharp,
        widthInPixels: uploadEdits.widthInPixels,
        withMetadata,
      })

      // Apply resize after cropping to ensure it conforms to resizeOptions
      if (resizeOptions) {
        const resizedAfterCrop = await sharp(croppedImage)
          .resize({
            fit: resizeOptions?.fit || 'cover',
            height: resizeOptions?.height,
            position: resizeOptions?.position || 'center',
            width: resizeOptions?.width,
          })
          .toBuffer({ resolveWithObject: true })

        filesToSave.push({
          buffer: resizedAfterCrop.data,
          path: `${staticPath}/${fsSafeName}`,
        })

        fileForResize = {
          ...fileForResize,
          data: resizedAfterCrop.data,
          size: resizedAfterCrop.info.size,
        }

        fileData.width = resizedAfterCrop.info.width
        fileData.height = resizedAfterCrop.info.height
        if (fileIsAnimatedType) {
          const metadata = await sharpFile.metadata()
          fileData.height = metadata.pages
            ? resizedAfterCrop.info.height / metadata.pages
            : resizedAfterCrop.info.height
        }
        fileData.filesize = resizedAfterCrop.info.size
      } else {
        // If resizeOptions is not present, just save the cropped image
        filesToSave.push({
          buffer: croppedImage,
          path: `${staticPath}/${fsSafeName}`,
        })

        fileForResize = {
          ...file,
          data: croppedImage,
          size: info.size,
        }

        fileData.width = info.width
        fileData.height = info.height
        if (fileIsAnimatedType) {
          const metadata = await sharpFile.metadata()
          fileData.height = metadata.pages ? info.height / metadata.pages : info.height
        }
        fileData.filesize = info.size
      }

      if (file.tempFilePath) {
        await fs.writeFile(file.tempFilePath, croppedImage) // write fileBuffer to the temp path
      } else {
        req.file = fileForResize
      }
    } else {
      filesToSave.push({
        buffer: fileBuffer?.data || file.data,
        path: `${staticPath}/${fsSafeName}`,
      })

      // If using temp files and the image is being resized, write the file to the temp path
      if (fileBuffer?.data || file.data.length > 0) {
        if (file.tempFilePath) {
          await fs.writeFile(file.tempFilePath, fileBuffer?.data || file.data) // write fileBuffer to the temp path
        } else {
          // Assign the _possibly modified_ file to the request object
          req.file = {
            ...file,
            data: fileBuffer?.data || file.data,
            size: fileBuffer?.info.size,
          }
        }
      }
    }

    if (fileSupportsResize && (Array.isArray(imageSizes) || focalPointEnabled !== false)) {
      req.payloadUploadSizes = {}
      const { focalPoint, sizeData, sizesToSave } = await resizeAndTransformImageSizes({
        config: collectionConfig,
        dimensions: !cropData
          ? dimensions
          : {
              ...dimensions,
              height: fileData.height,
              width: fileData.width,
            },
        file: fileForResize,
        mimeType: fileData.mimeType,
        req,
        savedFilename: fsSafeName || file.name,
        sharp,
        staticPath,
        uploadEdits,
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
    if (incomingData.focalX === origDoc.focalX && incomingData.focalY === origDoc.focalY) {
      return undefined
    }

    if (isDuplicating) {
      uploadEdits.focalPoint = {
        x: incomingData?.focalX || origDoc.focalX,
        y: incomingData?.focalY || origDoc.focalX,
      }
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
