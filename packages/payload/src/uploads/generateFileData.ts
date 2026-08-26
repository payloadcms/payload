import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import sanitize from 'sanitize-filename'

import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { PreparedUploadTransformation } from './transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave, UploadEdits } from './types.js'

import { FileRetrievalError, FileUploadError, Forbidden, MissingFile } from '../errors/index.js'
import { isNumber } from '../utilities/isNumber.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { generateImageSizeFilename } from './generateImageSizeFilename.js'
import { getExternalFile } from './getExternalFile.js'
import { getFileByPath } from './getFileByPath.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName } from './getSafeFilename.js'
import { parseFilename } from './parseFilename.js'
import { planTransformerPipeline } from './transformers/planTransformerPipeline.js'
import { transformUploadFile } from './transformers/transformUploadFile.js'
import { getUploadTransformerInternal } from './transformers/uploadTransformerBridge.js'
type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
  draft?: boolean
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

const shouldReupload = (
  uploadEdits: UploadEdits,
  fileData: Record<string, unknown> | undefined,
) => {
  if (!fileData) {
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

export const generateFileData = async <T>({
  collection: { config: collectionConfig },
  data,
  draft,
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

  const { serverURL } = req.payload.config

  let file = isDuplicating ? undefined : req.file

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
    staticDir,
  } = collectionConfig.upload

  const staticPath = staticDir

  const incomingFileData: Document = isDuplicating ? originalDoc : data
  let isLocalFile = false

  if (
    !file &&
    (isDuplicating || shouldReupload(uploadEdits, incomingFileData as Record<string, unknown>))
  ) {
    const { filename, url } = incomingFileData as unknown as FileData
    if (filename && (filename.includes('../') || filename.includes('..\\'))) {
      throw new Forbidden(req.t)
    }

    if ((serverURL && url?.startsWith(serverURL)) || url?.startsWith('/')) {
      isLocalFile = true
    }

    try {
      if (!disableLocalStorage && isLocalFile) {
        // File is stored locally
        const filePath = `${staticPath}/${filename}`
        const response = await getFileByPath(filePath)
        file = response
        overwriteExistingFiles = true
      } else if (filename && url) {
        // File is remote
        file = await getExternalFile({
          data: incomingFileData as unknown as FileData,
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
      data: incomingFileData!,
      files: [],
    }
  }

  await checkFileRestrictions({
    collection: collectionConfig,
    file,
    req,
  })

  if (!disableLocalStorage) {
    await fs.mkdir(staticPath!, { recursive: true })
  }

  let newData = incomingFileData as T
  const filesToSave: FileToSave[] = []
  const fileData: Partial<FileData> = {}

  try {
    const pipeline = await planTransformerPipeline({
      args: {
        collectionSlug: collectionConfig.slug,
        mimeType: file.mimetype,
        operation: 'upload',
        req,
      },
      capability: 'transformFile',
      transformers: req.payload.config.upload.transformers,
    })

    const bridgeTransformer = pipeline.find((transformer) =>
      Boolean(getUploadTransformerInternal(transformer)?.prepareUpload),
    )

    const originalWebFile = new File(
      [file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data],
      file.name,
      { type: file.mimetype },
    )

    let mainWebFile: File
    let sizeResults: PreparedUploadTransformation[] = []

    if (bridgeTransformer) {
      const bridge = getUploadTransformerInternal(bridgeTransformer)!

      const results = await bridge.prepareUpload!({
        collectionSlug: collectionConfig.slug,
        file: originalWebFile,
        req,
        transform: (task) =>
          transformUploadFile({
            collectionSlug: collectionConfig.slug,
            file: originalWebFile,
            options: task.options,
            pipeline,
            req,
          }),
        uploadEdits,
      })

      const mainResult = results.find((result) => result.fieldPath === 'filename')

      mainWebFile = mainResult?.file ?? originalWebFile
      fileData.width = mainResult?.width
      fileData.height = mainResult?.height
      sizeResults = results.filter((result) => result.fieldPath !== 'filename')

      if (focalPointEnabled && uploadEdits?.focalPoint) {
        fileData.focalX = isNumber(uploadEdits.focalPoint.x)
          ? Math.round(uploadEdits.focalPoint.x)
          : 50
        fileData.focalY = isNumber(uploadEdits.focalPoint.y)
          ? Math.round(uploadEdits.focalPoint.y)
          : 50
      }
    } else {
      mainWebFile = await transformUploadFile({
        collectionSlug: collectionConfig.slug,
        file: originalWebFile,
        options: undefined,
        pipeline,
        req,
      })
    }

    const fileWasTransformed = mainWebFile !== originalWebFile
    const mainBuffer = Buffer.from(await mainWebFile.arrayBuffer())

    let mimeType: string
    let ext: string | undefined

    if (fileWasTransformed) {
      const typeResult = await fileTypeFromBuffer(mainBuffer)
      ext = typeResult?.ext
      mimeType = typeResult?.mime ?? file.mimetype
    } else {
      mimeType = file.mimetype
      ext = file.name.includes('.') ? file.name.split('.').pop()?.split('?')[0] : ''
    }

    // Adjust SVG mime type. fromBuffer modifies it.
    if (mimeType === 'application/xml' && ext === 'svg') {
      mimeType = 'image/svg+xml'
    }
    fileData.mimeType = mimeType
    fileData.filesize = mainBuffer.length

    if (!bridgeTransformer) {
      try {
        const probed = await getImageSize({
          file: fileWasTransformed ? { ...file, data: mainBuffer } : file,
        })
        fileData.width = probed.width
        fileData.height = probed.height
      } catch {
        // Not a recognized image format — leave width/height unset.
      }
    }

    const baseFilename = sanitize(file.name.substring(0, file.name.lastIndexOf('.')) || file.name)
    let fsSafeName = `${baseFilename}${ext ? `.${ext}` : ''}`

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

    filesToSave.push({
      buffer: mainBuffer,
      path: `${staticPath}/${fsSafeName}`,
    })

    if (file.tempFilePath) {
      await fs.writeFile(file.tempFilePath, mainBuffer)
    } else {
      req.file = {
        ...file,
        data: mainBuffer,
        size: mainBuffer.length,
      }
    }

    if (sizeResults.length > 0) {
      req.payloadUploadSizes = {}
      const sizes: FileSizes = {}
      const { name: baseName, ext: baseExt } = parseFilename(fsSafeName)

      for (const result of sizeResults) {
        const sizeName = result.fieldPath.slice('sizes.'.length)

        if (!result.file) {
          sizes[sizeName] = {
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
        const sizeMimeType = sizeTypeResult?.mime || result.mimeType || fileData.mimeType

        req.payloadUploadSizes[sizeName] = sizeBuffer

        const imageSizeConfig = collectionConfig.upload.imageSizes?.find(
          (imageSize) => imageSize.name === sizeName,
        )

        const imageNameWithDimensions = imageSizeConfig?.generateImageName
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

        const imagePath = `${staticPath}/${imageNameWithDimensions}`

        sizes[sizeName] = {
          filename: imageNameWithDimensions,
          filesize: sizeBuffer.length,
          height: result.height!,
          mimeType: sizeMimeType,
          url: null,
          width: result.width!,
        }

        filesToSave.push({
          buffer: sizeBuffer,
          path: imagePath,
        })
      }

      fileData.sizes = sizes
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
    if (incomingData.focalX === origDoc.focalX && incomingData.focalY === origDoc.focalY) {
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
