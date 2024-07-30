import type { UploadedFile } from 'express-fileupload'
import type { OutputInfo, Sharp, SharpOptions } from 'sharp'

import { fromBuffer } from 'file-type'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import sanitize from 'sanitize-filename'
import sharp from 'sharp'

import type { Collection } from '../collections/config/types'
import type { SanitizedConfig } from '../config/types'
import type { PayloadRequest } from '../express/types'
import type { FileData, FileToSave, ProbedImageSize, UploadEdits } from './types'

import { FileUploadError, MissingFile } from '../errors'
import FileRetrievalError from '../errors/FileRetrievalError'
import canResizeImage from './canResizeImage'
import { cropImage } from './cropImage'
import { getExternalFile } from './getExternalFile'
import getFileByPath from './getFileByPath'
import getImageSize from './getImageSize'
import getSafeFileName from './getSafeFilename'
import resizeAndTransformImageSizes from './imageResizer'
import isImage from './isImage'
import { optionallyAppendMetadata } from './optionallyAppendMetadata'

type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
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
  config,
  data,
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

  let file = req.files?.file || undefined

  const uploadEdits = parseUploadEditsFromReqOrIncomingData({
    data,
    operation,
    originalDoc,
    req,
  })

  const {
    disableLocalStorage,
    focalPoint: focalPointEnabled,
    formatOptions,
    imageSizes,
    resizeOptions,
    staticDir,
    trimOptions,
    withMetadata,
  } = collectionConfig.upload

  let staticPath = staticDir
  if (staticDir.indexOf('/') !== 0) {
    staticPath = path.resolve(config.paths.configDir, staticDir)
  }

  if (!file && uploadEdits && data) {
    const { filename, url } = data as FileData

    try {
      if (url && url.startsWith('/') && !disableLocalStorage) {
        const filePath = `${staticPath}/${filename}`
        const response = await getFileByPath(filePath)
        file = response as UploadedFile
        overwriteExistingFiles = true
      } else if (filename && url) {
        file = (await getExternalFile({
          data: data as FileData,
          req,
          uploadConfig: collectionConfig.upload,
        })) as UploadedFile
        overwriteExistingFiles = true
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new FileRetrievalError(req.t, err.message)
      }
    }
  }

  if (!file) {
    if (throwOnMissingFile) throw new MissingFile(req.t)

    return {
      data,
      files: [],
    }
  }

  if (!disableLocalStorage) {
    mkdirp.sync(staticPath)
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
      Boolean(resizeOptions || formatOptions || imageSizes || trimOptions || file.tempFilePath)

    const sharpOptions: SharpOptions = {}

    if (fileIsAnimatedType) sharpOptions.animated = true

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
      ;({ ext, mime } = await fromBuffer(fileBuffer.data)) // This is getting an incorrect gif height back.
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
    if (mime === 'application/xml' && ext === 'svg') mime = 'image/svg+xml'
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

    if (cropData) {
      const { data: croppedImage, info } = await cropImage({
        cropData,
        dimensions,
        file,
        heightInPixels: uploadEdits.heightInPixels,
        req,
        widthInPixels: uploadEdits.widthInPixels,
        withMetadata,
      })

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

      if (file.tempFilePath) {
        await fs.promises.writeFile(file.tempFilePath, croppedImage) // write fileBuffer to the temp path
      } else {
        req.files.file = fileForResize
      }
    } else {
      filesToSave.push({
        buffer: fileBuffer?.data || file.data,
        path: `${staticPath}/${fsSafeName}`,
      })

      // If using temp files and the image is being resized, write the file to the temp path
      if (fileBuffer?.data || file.data.length > 0) {
        if (file.tempFilePath) {
          await fs.promises.writeFile(file.tempFilePath, fileBuffer?.data || file.data) // write fileBuffer to the temp path
        } else {
          // Assign the _possibly modified_ file to the request object
          req.files.file = {
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
    req.payload.logger.error({ err, msg: 'Error uploading file' })
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
  operation: 'create' | 'update'
  originalDoc: unknown
  req: PayloadRequest
}): UploadEdits {
  const { data, operation, originalDoc, req } = args

  // Get intended focal point change from query string or incoming data
  const uploadEdits =
    req.query?.uploadEdits && typeof req.query.uploadEdits === 'object'
      ? (req.query.uploadEdits as UploadEdits)
      : {}

  if (uploadEdits.focalPoint) return uploadEdits

  const incomingData = data as FileData
  const origDoc = originalDoc as FileData

  // If no change in focal point, return undefined.
  // This prevents a refocal operation triggered from admin, because it always sends the focal point.
  if (origDoc && incomingData.focalX === origDoc.focalX && incomingData.focalY === origDoc.focalY) {
    return undefined
  }

  if (incomingData.focalX && incomingData.focalY) {
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
