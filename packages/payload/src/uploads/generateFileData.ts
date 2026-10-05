import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import { createHash } from 'node:crypto'
import { openAsBlob } from 'node:fs'

import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { ExternalUploadSource } from './sanitizeUploadData.js'
import type { PreparedUploadTransformation } from './transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave, UploadEdits } from './types.js'

import { resolveBranch } from '../branching/resolveBranch.js'
import { MAIN_BRANCH } from '../branching/types.js'
import { FileRetrievalError, FileUploadError, Forbidden, MissingFile } from '../errors/index.js'
import { isNumber } from '../utilities/isNumber.js'
import { canResizeImage } from './canResizeImage.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { downloadFileToBuffer } from './downloadFileToBuffer.js'
import { generateImageSizeFilename } from './generateImageSizeFilename.js'
import { getFileByPath } from './getFileByPath.js'
import { getFileExtension, getSanitizedUploadFilename } from './getFileTypeIdentity.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName } from './getSafeFilename.js'
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

  const staticPath = staticDir

  const incomingFileData: Document = isDuplicating ? originalDoc : data
  const fileDataToReupload: Document | undefined =
    operation === 'update' ? originalDoc : incomingFileData
  const fileSourceData =
    externalUploadSource ?? (fileDataToReupload as unknown as FileData | undefined)
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

    const bridgeTransformer = canRunTransformers
      ? pipeline.find((transformer) =>
          Boolean(getUploadTransformerInternal(transformer)?.prepareUpload),
        )
      : undefined

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
              pipeline,
              req,
            }),
          uploadEdits,
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
    const mainBuffer = fileWasTransformed
      ? Buffer.from(await mainWebFile!.arrayBuffer())
      : undefined

    // A transformed file is named after what the transformer returned, not the upload.
    const outputName = (fileWasTransformed && mainWebFile!.name) || file.name

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
    const branch = resolveBranch(req)
    const isIsolatedProviderUpload = Boolean(
      file.uploadReference &&
        typeof file.uploadReference === 'object' &&
        !Array.isArray(file.uploadReference) &&
        '_objectKey' in file.uploadReference &&
        typeof file.uploadReference._objectKey === 'string',
    )
    const shouldIsolateBranchFile = branch !== MAIN_BRANCH && !isIsolatedProviderUpload

    if (shouldIsolateBranchFile) {
      fsSafeName = getBranchUploadFilename({ branch, filename: fsSafeName })
      overwriteExistingFiles = false
    }

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
    } else {
      // file.data is empty when useTempFiles is on, so the real content lives at
      // file.tempFilePath instead (see the function doc for why we avoid buffering it).
      const tempFileHandling = resolveTempFileHandling({
        disableLocalStorage: Boolean(disableLocalStorage),
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

const maximumFilesystemFilenameByteLength = 255
// `getSafeFileName` can add a numeric suffix. Reserve `-` plus 11 digits for that step.
const deduplicationSuffixByteReserve = 12

/** Adds a stable branch suffix without exceeding the common filesystem filename byte limit. */
export const getBranchUploadFilename = ({
  branch,
  filename,
}: {
  branch: string
  filename: string
}): string => {
  const maximumInitialFilenameByteLength =
    maximumFilesystemFilenameByteLength - deduplicationSuffixByteReserve
  const ext = getFileExtension(filename)
  let extension = ext ? `.${ext}` : ''
  const name = extension ? filename.slice(0, -extension.length) : filename
  const escapedBranch = branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const unscopedName = name.replace(new RegExp(`-${escapedBranch}(?:-\\d+)?$`), '')
  const branchHash = createHash('sha256').update(branch).digest('hex').slice(0, 12)
  const minimumBranchSuffix = `-${branchHash}`
  const maximumExtensionByteLength =
    maximumInitialFilenameByteLength - Buffer.byteLength(minimumBranchSuffix) - 1

  extension = truncateUtf8ByByteLength({
    maximumByteLength: maximumExtensionByteLength,
    value: extension,
  })

  const maximumBranchSuffixByteLength =
    maximumInitialFilenameByteLength - Buffer.byteLength(extension) - 1
  let branchSuffix = `-${branch}`

  if (Buffer.byteLength(branchSuffix) > maximumBranchSuffixByteLength) {
    const maximumBranchPrefixByteLength =
      maximumBranchSuffixByteLength - Buffer.byteLength(minimumBranchSuffix) - 1
    const branchPrefix = truncateUtf8ByByteLength({
      maximumByteLength: maximumBranchPrefixByteLength,
      value: branch,
    })

    branchSuffix = branchPrefix ? `-${branchPrefix}${minimumBranchSuffix}` : minimumBranchSuffix
  }

  const maximumNameByteLength =
    maximumInitialFilenameByteLength -
    Buffer.byteLength(branchSuffix) -
    Buffer.byteLength(extension)
  const truncatedName = truncateUtf8ByByteLength({
    maximumByteLength: maximumNameByteLength,
    value: unscopedName,
  })

  return `${truncatedName}${branchSuffix}${extension}`
}

const truncateUtf8ByByteLength = ({
  maximumByteLength,
  value,
}: {
  maximumByteLength: number
  value: string
}): string => {
  let byteLength = 0
  let result = ''

  for (const character of value) {
    const characterByteLength = Buffer.byteLength(character)

    if (byteLength + characterByteLength > maximumByteLength) {
      break
    }

    byteLength += characterByteLength
    result += character
  }

  return result
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
