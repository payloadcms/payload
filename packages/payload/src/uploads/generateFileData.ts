import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import { randomUUID } from 'node:crypto'
import { openAsBlob } from 'node:fs'

import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { ExternalUploadSource } from './sanitizeUploadData.js'
import type { PreparedUploadTransformation } from './transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave, UploadEdits } from './types.js'

import { FileRetrievalError, FileUploadError, Forbidden, MissingFile } from '../errors/index.js'
import { formatAdminURL } from '../utilities/formatAdminURL.js'
import { isNumber } from '../utilities/isNumber.js'
import { canResizeImage } from './canResizeImage.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { downloadFileToBuffer } from './downloadFileToBuffer.js'
import { getOriginalFilename } from './fileVersioning/naming.js'
import { generateImageSizeFilename } from './generateImageSizeFilename.js'
import { getFileByPath } from './getFileByPath.js'
import { getFileExtension, getSanitizedUploadFilename } from './getFileTypeIdentity.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName, incrementName } from './getSafeFilename.js'
import { hasCropOrResizeEdit } from './hasCropOrResizeEdit.js'
import { hasFullFileContents } from './hasFullFileContents.js'
import { isProcessableImage } from './isProcessableImage.js'
import { parseFilename } from './parseFilename.js'
import { planTransformerPipeline } from './transformers/planTransformerPipeline.js'
import { transformUploadFile } from './transformers/transformUploadFile.js'
import {
  getUploadTransformerInternal,
  setUploadFilePath,
} from './transformers/uploadTransformerBridge.js'
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
  files: FileToSave[]
}>

const shouldReupload = (
  uploadEdits: undefined | UploadEdits,
  fileData: Record<string, unknown> | undefined,
) => {
  if (!fileData || !uploadEdits) {
    return false
  }

  if (hasCropOrResizeEdit(uploadEdits)) {
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

export type TempFileHandling =
  | { sourcePath: string; type: 'copyFromTempFile' }
  | { type: 'skip' }
  | { type: 'useBuffer' }

/**
 * Decides how to get a file's bytes onto disk when no transformer rewrote it (a transformed
 * file is already an in-memory buffer, so it always takes the `useBuffer` path). Copies straight
 * from the temp file when possible, rather than reading a potentially large temp file into memory
 * just to write it back out - see the `generateFileData` function doc for why.
 */
export const resolveTempFileHandling = ({
  disableLocalStorage,
  hasProcessedBuffer,
  tempFilePath,
}: {
  disableLocalStorage: boolean
  hasProcessedBuffer: boolean
  tempFilePath: string | undefined
}): TempFileHandling => {
  if (hasProcessedBuffer || !tempFilePath) {
    return { type: 'useBuffer' }
  }

  return disableLocalStorage
    ? { type: 'skip' }
    : { type: 'copyFromTempFile', sourcePath: tempFilePath }
}

/**
 * Builds the document's file metadata and the list of files to write to disk.
 *
 * A large client upload may arrive as a temp file instead of an in-memory buffer (see
 * getFileFromUploadInstructions.ts), and `file.data` can hold only a partial probe rather than
 * the full file. To avoid loading such files into memory unnecessarily, no transformer runs
 * unless the full bytes are available, this skips reading a temp file entirely when local
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

  const { serverURL } = req.payload.config

  let file = isDuplicating ? undefined : req.file

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
    disableLocalStorage,
    focalPoint: focalPointEnabled = true,
    staticDir,
  } = collectionConfig.upload
  const hasManagedCloudStorage = Boolean(collectionConfig.upload.fileOperations)
  const uploadReference = file?.uploadReference
  const hasProviderDirectReference =
    uploadReference && typeof uploadReference === 'object' && !('uploadId' in uploadReference)
  const verifiedOriginal = req.context?._payloadVerifiedProviderOriginal as
    | {
        _objectKey?: string
        filename: string
        key: string
        prefix?: string
        signedReceipt: string
      }
    | undefined
  const providerOriginal =
    hasProviderDirectReference &&
    'signedReceipt' in uploadReference &&
    uploadReference.signedReceipt === verifiedOriginal?.signedReceipt &&
    verifiedOriginal &&
    typeof collectionConfig.upload.adapter === 'string'
      ? {
          _objectKey: verifiedOriginal._objectKey,
          filename: verifiedOriginal.filename,
          key: verifiedOriginal.key,
          prefix: verifiedOriginal.prefix,
        }
      : undefined
  const shouldStageCloudFiles = hasManagedCloudStorage && !hasProviderDirectReference

  const staticPath = staticDir

  const incomingFileData: Document = isDuplicating ? originalDoc : data
  const currentFileData = (operation === 'update' ? originalDoc : incomingFileData) as
    | FileData
    | undefined
  const retainedOriginal =
    operation === 'update' &&
    !file &&
    !externalUploadSource &&
    typeof currentFileData?.original?.filename === 'string' &&
    typeof currentFileData.original.url === 'string'
      ? currentFileData.original
      : undefined
  const fileSourceData = externalUploadSource ?? retainedOriginal ?? currentFileData
  let isLocalFile = false

  if (
    !file &&
    fileSourceData &&
    (externalUploadSource ||
      isDuplicating ||
      shouldReupload(uploadEdits, incomingFileData as Record<string, unknown>))
  ) {
    const { filename, url } = fileSourceData
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
        file = response
        overwriteExistingFiles = true
      } else if (filename && retainedOriginal && hasManagedCloudStorage) {
        const { retrieveFileResponse } = await import('./endpoints/getFile.js')
        const response = await retrieveFileResponse({
          collection: { config: collectionConfig },
          doc: originalDoc as TypeWithID,
          filename,
          operation: 'transform',
          req,
        })
        if (!response.ok) {
          throw new Error(`Unable to read retained original ${filename}`)
        }
        const buffer = Buffer.from(await response.arrayBuffer())
        file = {
          name: filename,
          data: buffer,
          mimetype: retainedOriginal.mimeType,
          size: buffer.length,
        }
        overwriteExistingFiles = true
      } else if (filename && url) {
        // File is remote
        file = await downloadFileToBuffer({
          data: fileSourceData,
          req,
          uploadConfig: collectionConfig.upload,
        })
        overwriteExistingFiles = !externalUploadSource
      }
    } catch (err: unknown) {
      throw new FileRetrievalError(req.t, err instanceof Error ? err.message : undefined)
    }

    if (file && retainedOriginal && currentFileData?.filename) {
      file = { ...file, name: currentFileData.filename }
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

  if (!disableLocalStorage) {
    await fs.mkdir(staticPath!, { recursive: true })
  }

  let newData = incomingFileData as T
  const filesToSave: FileToSave[] = []
  const fileData: Partial<FileData> = {}
  const crop = uploadEdits?.crop
  const isResettingCrop =
    retainedOriginal &&
    crop?.unit === '%' &&
    Number(crop.width) === 100 &&
    Number(crop.height) === 100 &&
    Number(crop.x) === 0 &&
    Number(crop.y) === 0 &&
    (uploadEdits.widthInPixels === undefined ||
      Number(uploadEdits.widthInPixels) === retainedOriginal.width) &&
    (uploadEdits.heightInPixels === undefined ||
      Number(uploadEdits.heightInPixels) === retainedOriginal.height)
  const hasFocalPointChange =
    uploadEdits?.focalPoint &&
    (Number(uploadEdits.focalPoint.x) !== (currentFileData?.focalX ?? 50) ||
      Number(uploadEdits.focalPoint.y) !== (currentFileData?.focalY ?? 50))
  const editsForTransformer = isResettingCrop
    ? { ...uploadEdits, crop: undefined, heightInPixels: undefined, widthInPixels: undefined }
    : uploadEdits

  try {
    const pipeline = await planTransformerPipeline({
      args: {
        collectionSlug: collectionConfig.slug,
        mimeType: file.mimetype,
        operation: 'upload',
        req,
      },
      capability: 'transformFile',
      transformers: req.payload.config.upload?.transformers ?? [],
    })

    // A large client upload can arrive as a bounded probe alongside a temp file. Transformers
    // need the whole file, so leave such an upload untouched rather than buffering it.
    const canRunTransformers = pipeline.length > 0 && hasFullFileContents(file)

    const bridgeTransformers = canRunTransformers
      ? pipeline.filter((transformer) =>
          Boolean(getUploadTransformerInternal(transformer)?.prepareUpload),
        )
      : []

    const bridgeTransformer =
      bridgeTransformers.find((transformer) =>
        getUploadTransformerInternal(transformer)!.handlesCollection?.({
          collectionSlug: collectionConfig.slug,
        }),
      ) ?? bridgeTransformers[0]

    // The chosen bridge's task options are private to it, so other bridges must not see them.
    const bridgeTaskPipeline = pipeline.filter(
      (transformer) =>
        transformer === bridgeTransformer || !bridgeTransformers.includes(transformer),
    )

    let originalWebFile: File | undefined
    let mainWebFile: File | undefined
    let hasDimensionsFromBridge = false
    let sizeResults: PreparedUploadTransformation[] = []

    if (canRunTransformers) {
      const fileContents = file.tempFilePath ? await openAsBlob(file.tempFilePath) : file.data
      originalWebFile = new File([fileContents], file.name, { type: file.mimetype })
      if (file.tempFilePath) {
        setUploadFilePath(originalWebFile, file.tempFilePath)
      }

      if (bridgeTransformer) {
        const bridge = getUploadTransformerInternal(bridgeTransformer)!

        const results = await bridge.prepareUpload!({
          collectionSlug: collectionConfig.slug,
          file: originalWebFile,
          req,
          transform: (task) =>
            transformUploadFile({
              collectionSlug: collectionConfig.slug,
              file: task.file ?? originalWebFile!,
              options: task.options,
              pipeline: bridgeTaskPipeline,
              req,
            }),
          uploadEdits: editsForTransformer,
        })

        const mainResult = results.find((result) => result.fieldPath === 'filename')

        mainWebFile = mainResult?.file ?? originalWebFile
        fileData.width = mainResult?.width
        fileData.height = mainResult?.height
        hasDimensionsFromBridge = true
        sizeResults = results.filter((result) => result.fieldPath !== 'filename')
      } else {
        mainWebFile = await transformUploadFile({
          collectionSlug: collectionConfig.slug,
          file: originalWebFile,
          options: undefined,
          pipeline,
          req,
        })
      }
    }

    // Saved for any resizable image, not just one a transformer processed, so it's kept with no
    // transformer registered and on a header-only client upload.
    if (
      focalPointEnabled &&
      uploadEdits?.focalPoint &&
      (hasDimensionsFromBridge || canResizeImage(file.mimetype))
    ) {
      fileData.focalX = isNumber(uploadEdits.focalPoint.x)
        ? Math.round(uploadEdits.focalPoint.x)
        : 50
      fileData.focalY = isNumber(uploadEdits.focalPoint.y)
        ? Math.round(uploadEdits.focalPoint.y)
        : 50
    }

    const fileWasTransformed = Boolean(mainWebFile && mainWebFile !== originalWebFile)
    const hasReusableOriginalMain = Boolean(
      isResettingCrop && !fileWasTransformed && retainedOriginal,
    )
    if (hasReusableOriginalMain && !hasFocalPointChange && retainedOriginal) {
      return {
        data: {
          ...incomingFileData,
          _objectKey: retainedOriginal._objectKey,
          filename: retainedOriginal.filename,
          filesize: retainedOriginal.filesize,
          height: retainedOriginal.height,
          mimeType: retainedOriginal.mimeType,
          original: retainedOriginal,
          prefix: retainedOriginal.prefix,
          url: retainedOriginal.url,
          variants: currentFileData?.variants,
          width: retainedOriginal.width,
          ...(draft ? { _status: 'draft' } : {}),
        } as T,
        files: [],
      }
    }
    const mainBuffer = fileWasTransformed
      ? Buffer.from(await mainWebFile!.arrayBuffer())
      : undefined

    // A transformed file is named after what the transformer returned, not the upload.
    const outputName = hasReusableOriginalMain
      ? retainedOriginal!.filename
      : (fileWasTransformed && mainWebFile!.name) || file.name

    let mimeType: string
    let ext: string | undefined

    if (mainBuffer) {
      // Detected bytes win for binary formats (Sharp keeps the input's name and type on a
      // converted output), but text-like output such as CSV has no signature to detect, so
      // fall back to the type and extension the transformer declared on the returned File.
      const typeResult = await fileTypeFromBuffer(mainBuffer)
      ext =
        typeResult?.ext ?? (getFileExtension(getSanitizedUploadFilename(outputName)) || undefined)
      mimeType = typeResult?.mime ?? (mainWebFile!.type || file.mimetype)
    } else {
      mimeType = file.mimetype
      ext = getFileExtension(getSanitizedUploadFilename(file.name))
    }

    // Adjust SVG mime type. fromBuffer modifies it.
    if (mimeType === 'application/xml' && ext === 'svg') {
      mimeType = 'image/svg+xml'
    }
    fileData.mimeType = mimeType
    fileData.filesize = mainBuffer ? mainBuffer.length : file.size

    // Only probe formats that could carry dimensions - probing reads the file, and a large
    // non-image upload may only exist as a temp file we deliberately never buffer.
    if (!hasDimensionsFromBridge && isProcessableImage(mimeType)) {
      try {
        const probed = await getImageSize({
          file: mainBuffer ? { ...file, data: mainBuffer, tempFilePath: undefined } : file,
        })
        fileData.width = probed.width
        fileData.height = probed.height
      } catch {
        // Not a recognized image format — leave width/height unset.
      }
    }

    let fsSafeName = getSanitizedUploadFilename(outputName, ext)
    const isDuplicatingAnOriginal =
      isDuplicating && file.name === (originalDoc as FileData | undefined)?.original?.filename

    // A provider reference without a receipt names an object the client already stored; renaming
    // it would point the document at a key that was never uploaded.
    const isUnverifiedProviderReference = Boolean(hasProviderDirectReference && !providerOriginal)

    if (
      !fileWasTransformed &&
      !retainedOriginal &&
      !providerOriginal &&
      !isDuplicatingAnOriginal &&
      !isUnverifiedProviderReference
    ) {
      fsSafeName = getOriginalFilename({ filename: fsSafeName })
    }

    if (hasReusableOriginalMain) {
      fsSafeName = retainedOriginal!.filename
    } else if (
      !overwriteExistingFiles ||
      !disableLocalStorage ||
      (shouldStageCloudFiles && retainedOriginal)
    ) {
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
    if (hasReusableOriginalMain) {
      fileData.url = retainedOriginal!.url
    }

    const hasGeneratedProviderRepresentations = Boolean(
      providerOriginal &&
        (fileWasTransformed || sizeResults.some((result) => Boolean(result.file))),
    )
    const newObjectKey =
      hasManagedCloudStorage && (shouldStageCloudFiles || hasGeneratedProviderRepresentations)
        ? randomUUID()
        : undefined
    if (newObjectKey) {
      fileData._objectKey = newObjectKey
    }
    if (providerOriginal && !fileWasTransformed) {
      fileData._objectKey = providerOriginal._objectKey
      fileData.prefix = providerOriginal.prefix
    }
    if (hasReusableOriginalMain && retainedOriginal) {
      fileData._objectKey = retainedOriginal._objectKey
      fileData.prefix = retainedOriginal.prefix
    }

    if (!disableLocalStorage || shouldStageCloudFiles || providerOriginal) {
      const originalFilename =
        retainedOriginal?.filename ??
        providerOriginal?.filename ??
        (fileWasTransformed
          ? await getSafeFileName({
              collectionSlug: collectionConfig.slug,
              desiredFilename: getOriginalFilename({
                filename: getSanitizedUploadFilename(file.name),
              }),
              req,
              staticPath: staticPath!,
            })
          : fsSafeName)
      const original =
        retainedOriginal ??
        ({
          _objectKey: providerOriginal ? providerOriginal._objectKey : newObjectKey,
          filename: originalFilename,
          filesize: file.size,
          mimeType: file.mimetype,
          prefix: providerOriginal?.prefix ?? currentFileData?.prefix,
          url: formatAdminURL({
            apiRoute: req.payload.config.routes.api,
            path: `/${collectionConfig.slug}/file/${encodeURIComponent(originalFilename)}`,
            relative: true,
            serverURL: req.payload.config.serverURL,
          }),
        } as NonNullable<FileData['original']>)

      if (!retainedOriginal && isProcessableImage(file.mimetype)) {
        try {
          const dimensions = await getImageSize({ file })
          original.width = dimensions.width
          original.height = dimensions.height
        } catch {
          // Files with an image MIME type may not have readable dimensions.
        }
      }

      fileData.original = original

      if (providerOriginal) {
        if (!fileWasTransformed) {
          fileData.filename = originalFilename
        }
      }

      if (fileWasTransformed && !retainedOriginal && !providerOriginal) {
        filesToSave.push({
          buffer: Buffer.from(await originalWebFile!.arrayBuffer()),
          path: `${staticPath}/${originalFilename}`,
        })
      }
    }

    if (mainBuffer) {
      // The stored bytes are no longer the ones the client uploaded, so the client's upload
      // reference must not be reused for them.
      delete file.uploadReference

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
    } else if (!hasReusableOriginalMain) {
      // file.data is empty when useTempFiles is on, so the real content lives at
      // file.tempFilePath instead (see the function doc for why we avoid buffering it).
      const tempFileHandling = resolveTempFileHandling({
        disableLocalStorage: Boolean(disableLocalStorage) && !shouldStageCloudFiles,
        hasProcessedBuffer: false,
        tempFilePath: file.tempFilePath,
      })

      if (tempFileHandling.type === 'copyFromTempFile') {
        filesToSave.push({
          path: `${staticPath}/${fsSafeName}`,
          sourcePath: tempFileHandling.sourcePath,
        })
      } else if (tempFileHandling.type === 'useBuffer') {
        const bufferToSave = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data

        // A 'header'/'none' content requirement (see getFileContentRequirement.ts) means
        // file.data is only a partial probe, not the real content - never save it as-is.
        const fileDataIsPartialView = !file.tempFilePath && bufferToSave.length !== file.size

        if (!fileDataIsPartialView) {
          filesToSave.push({
            buffer: bufferToSave,
            path: `${staticPath}/${fsSafeName}`,
          })

          if (bufferToSave.length > 0) {
            if (file.tempFilePath) {
              await fs.writeFile(file.tempFilePath, bufferToSave)
            } else {
              // Keep req.file in sync, since downstream hooks/plugins may read it.
              req.file = {
                ...file,
                data: bufferToSave,
                size: bufferToSave.length,
              }
            }
          }
        }
      }
    }

    if (sizeResults.length > 0) {
      req.payloadUploadSizes = {}
      const sizes: FileSizes = {}
      const { name: baseName, ext: baseExt } = parseFilename(fsSafeName)
      const plannedNames = new Set([fileData.original?.filename, fsSafeName])
      const plannedSizeBuffers = new Map<string, Buffer>()

      for (const result of sizeResults) {
        const sizeName = result.fieldPath.slice('variants.'.length)

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

        const imageSizeConfig = collectionConfig.upload.variants?.find(
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

        let imageName = imageNameWithDimensions

        if (!disableLocalStorage || shouldStageCloudFiles) {
          const prefix = (data as Record<string, unknown>)?.prefix as string | undefined

          while (true) {
            imageName = await getSafeFileName({
              collectionSlug: collectionConfig.slug,
              desiredFilename: imageName,
              prefix,
              req,
              staticPath: disableLocalStorage ? undefined : staticPath!,
            })
            if (plannedSizeBuffers.get(imageName)?.equals(sizeBuffer)) {
              break
            }
            if (!plannedNames.has(imageName)) {
              break
            }
            imageName = incrementName(imageName)
          }
          plannedNames.add(imageName)
        }

        const imagePath = `${staticPath}/${imageName}`

        sizes[sizeName] = {
          _objectKey: newObjectKey,
          filename: imageName,
          filesize: sizeBuffer.length,
          height: result.height!,
          mimeType: sizeMimeType,
          prefix: providerOriginal?.prefix ?? currentFileData?.prefix,
          url: null,
          width: result.width!,
        }

        if (!plannedSizeBuffers.has(imageName)) {
          plannedSizeBuffers.set(imageName, sizeBuffer)
          filesToSave.push({
            buffer: sizeBuffer,
            path: imagePath,
          })
        }
      }

      fileData.variants = sizes
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
    // Admin always resends the current focal point, so treat an unchanged value as no edit.
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
