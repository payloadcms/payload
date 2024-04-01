import type { OutputInfo, Sharp, SharpOptions } from 'sharp'

import fileType from 'file-type'
const { fromBuffer } = fileType
import fs from 'fs'
import mkdirp from 'mkdirp'
import sanitize from 'sanitize-filename'

import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { FileData, FileToSave, ProbedImageSize } from './types.js'

import { FileUploadError, MissingFile } from '../errors/index.js'
import canResizeImage from './canResizeImage.js'
import cropImage from './cropImage.js'
import { getExternalFile } from './getExternalFile.js'
import { getFileByPath } from './getFileByPath.js'
import { getImageSize } from './getImageSize.js'
import getSafeFileName from './getSafeFilename.js'
import resizeAndTransformImageSizes from './imageResizer.js'
import isImage from './isImage.js'

type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
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

  const uploadEdits = req.query['uploadEdits'] || {}

  const { disableLocalStorage, formatOptions, imageSizes, resizeOptions, staticDir, trimOptions } =
    collectionConfig.upload

  const staticPath = staticDir

  if (!file && uploadEdits && data) {
    const { filename, url } = data as FileData

    try {
      if (url && url.startsWith('/') && !disableLocalStorage) {
        const filePath = `${staticPath}/${filename}`
        const response = await getFileByPath(filePath)
        file = response
        overwriteExistingFiles = true
      } else if (filename && url) {
        file = await getExternalFile({ data: data as FileData, req })
        overwriteExistingFiles = true
      }
    } catch (err) {
      throw new FileUploadError(req.t)
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
  const fileIsAnimated = file.mimetype === 'image/gif' || file.mimetype === 'image/webp'
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

    if (fileIsAnimated) sharpOptions.animated = true

    if (fileHasAdjustments && sharp) {
      if (file.tempFilePath) {
        sharpFile = sharp(file.tempFilePath, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
      } else {
        sharpFile = sharp(file.data, sharpOptions).rotate() // pass rotate() to auto-rotate based on EXIF data. https://github.com/payloadcms/payload/pull/3081
      }

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

    if (fileSupportsResize || isImage(file.mimetype)) {
      dimensions = getImageSize(file)
      fileData.width = dimensions.width
      fileData.height = dimensions.height
    }

    if (sharpFile) {
      const metadata = await sharpFile.metadata()
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
        ext = file.name.split('.').pop()
      } else {
        ext = ''
      }
    }

    // Adust SVG mime type. fromBuffer modifies it.
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

    if (cropData && sharp) {
      const { data: croppedImage, info } = await cropImage({ cropData, dimensions, file, sharp })

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
      fileData.filesize = info.size

      if (file.tempFilePath) {
        await fs.promises.writeFile(file.tempFilePath, croppedImage) // write fileBuffer to the temp path
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
          await fs.promises.writeFile(file.tempFilePath, fileBuffer?.data || file.data) // write fileBuffer to the temp path
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

    if (Array.isArray(imageSizes) && fileSupportsResize && sharp) {
      req.payloadUploadSizes = {}
      const { sizeData, sizesToSave } = await resizeAndTransformImageSizes({
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
      })

      fileData.sizes = sizeData
      filesToSave.push(...sizesToSave)
    }
  } catch (err) {
    console.error(err)
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
