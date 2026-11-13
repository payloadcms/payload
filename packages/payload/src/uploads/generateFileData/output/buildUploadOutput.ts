import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import { randomUUID } from 'node:crypto'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../../types/index.js'
import type { FileData, FileToSave, FocalPoint, OriginalFileData } from '../../types.js'
import type { UploadTransformerOutput } from '../runUploadTransformers.js'
import type { UploadStorage } from '../utils/getUploadStorage.js'

import { formatAdminURL } from '../../../utilities/formatAdminURL.js'
import { isNumber } from '../../../utilities/isNumber.js'
import { canResizeImage } from '../../canResizeImage.js'
import { getFileExtension, getSanitizedUploadFilename } from '../../getFileTypeIdentity.js'
import { getImageSize } from '../../getImageSize.js'
import { getSafeFileName, getUnplannedSafeFileName } from '../../getSafeFilename.js'
import { isProcessableImage } from '../../isProcessableImage.js'
import { isRequestTimeFile } from '../../isRequestTimeFile.js'
import { getRequestTimeDefaultFileData, getRequestTimeVariants } from '../../requestTimeFileData.js'
import { canBuildAtRequest } from '../../transformState/planUpload.js'
import { buildVariantOutputs } from './buildVariantOutputs.js'
import { resolveTempFileHandling } from './resolveTempFileHandling.js'

type IncomingFile = NonNullable<PayloadRequest['file']>

/**
 * Builds the saved file fields and the list of files to store, from the incoming file and what the
 * stages returned. In this order:
 * 1. The main file: its name, type, size and dimensions.
 * 2. The original, when it can be stored.
 * 3. The main file to store. This also updates `req.file` or the temp file to the stored bytes.
 * 4. The sizes that the upload bridge built.
 * 5. The fields for files that request-time stages build.
 *
 * A crop reset that no stage changed reuses the retained original as the main file, and stores
 * nothing.
 */
export async function buildUploadOutput({
  collection,
  currentFileData,
  documentID,
  file,
  focalPoint,
  isAppliedAtRequest,
  isResettingCrop,
  pipelineDoc,
  pipelineOriginalDoc,
  prefix,
  req,
  retainedOriginal,
  shouldOverwriteExistingFiles,
  storage,
  transformed,
}: {
  collection: SanitizedCollectionConfig
  /** The file data the document has before this operation. */
  currentFileData?: FileData
  /** The ID of the document that an update changes. */
  documentID?: number | string
  /** The incoming file. Its upload reference is removed when the stored bytes change. */
  file: IncomingFile
  focalPoint: {
    /** The focal point differs from the stored one. */
    hasChange: boolean
    /** The focal point that the pipeline applied. */
    value?: FocalPoint
  }
  isAppliedAtRequest: boolean
  /** The edits remove the crop of a document that keeps its original. */
  isResettingCrop: boolean
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  /** The storage prefix of the incoming data. */
  prefix?: string
  req: PayloadRequest
  retainedOriginal?: OriginalFileData
  /** The main file may replace a stored file with the same name. */
  shouldOverwriteExistingFiles: boolean
  storage: UploadStorage
  /** What the stages returned. Undefined when no stage ran. */
  transformed?: UploadTransformerOutput
}): Promise<{ fileData: Partial<FileData>; files: FileToSave[] }> {
  const {
    disableLocalStorage,
    focalPoint: isFocalPointEnabled = true,
    staticDir,
  } = collection.upload
  const { canStoreOriginal, hasManagedCloudStorage, providerOriginal, shouldStageCloudFiles } =
    storage
  const transformedMainFile = transformed?.transformedMainFile
  const sizeResults = transformed?.sizeResults ?? []
  const reusedOriginal = isResettingCrop && !transformedMainFile ? retainedOriginal : undefined
  // Each new cloud version is stored in its own `_objectKey` folder, so the document's own files
  // cannot collide with it and the name can stay the same.
  const ownDocumentID = hasManagedCloudStorage ? documentID : undefined
  const fileData: Partial<FileData> = {}
  const files: FileToSave[] = []

  if (transformed?.bridgeDimensions) {
    fileData.width = transformed.bridgeDimensions.width
    fileData.height = transformed.bridgeDimensions.height
  }

  // Saved for any resizable image, not just one a transformer processed, so it's kept with no
  // transformer registered and on a header-only client upload.
  if (
    isFocalPointEnabled &&
    focalPoint.value &&
    (transformed?.bridgeDimensions || canResizeImage(file.mimetype))
  ) {
    fileData.focalX = isNumber(focalPoint.value.x) ? Math.round(focalPoint.value.x) : 50
    fileData.focalY = isNumber(focalPoint.value.y) ? Math.round(focalPoint.value.y) : 50
  }

  if (reusedOriginal && !focalPoint.hasChange) {
    return {
      fileData: getRetainedOriginalFileData({ currentFileData, retainedOriginal: reusedOriginal }),
      files: [],
    }
  }

  const main = await describeMainFile({
    file,
    shouldProbeDimensions: !transformed?.bridgeDimensions,
    transformedMainFile,
  })

  fileData.mimeType = main.mimeType
  fileData.filesize = main.filesize

  if (main.dimensions) {
    fileData.width = main.dimensions.width
    fileData.height = main.dimensions.height
  }

  const filename = reusedOriginal
    ? reusedOriginal.filename
    : !shouldOverwriteExistingFiles ||
        !disableLocalStorage ||
        (shouldStageCloudFiles && retainedOriginal)
      ? await getSafeFileName({
          collectionSlug: collection.slug,
          desiredFilename: main.filename,
          excludeDocumentID: ownDocumentID,
          prefix,
          req,
          staticPath: staticDir!,
        })
      : main.filename

  fileData.filename = filename

  if (reusedOriginal) {
    fileData.url = reusedOriginal.url
  }

  const hasGeneratedProviderRepresentations = Boolean(
    providerOriginal && (transformedMainFile || sizeResults.some((result) => Boolean(result.file))),
  )
  const newObjectKey =
    hasManagedCloudStorage && (shouldStageCloudFiles || hasGeneratedProviderRepresentations)
      ? randomUUID()
      : undefined

  if (newObjectKey) {
    fileData._objectKey = newObjectKey
  }

  // The client already uploaded this object, so it must not be saved again.
  const isProviderObjectMain = Boolean(providerOriginal && !transformedMainFile)

  if (isProviderObjectMain) {
    fileData._objectKey = providerOriginal!._objectKey
    fileData.prefix = providerOriginal!.prefix
  }

  if (reusedOriginal) {
    fileData._objectKey = reusedOriginal._objectKey
    fileData.prefix = reusedOriginal.prefix
  }

  if (canStoreOriginal) {
    const { original, originalFileToSave } = await buildOriginalOutput({
      collection,
      currentFileData,
      excludeDocumentID: ownDocumentID,
      file,
      mainFilename: filename,
      newObjectKey,
      prefix,
      providerOriginal: storage.providerOriginal,
      req,
      retainedOriginal,
      transformed,
    })

    fileData.original = original

    if (isProviderObjectMain) {
      fileData.filename = original.filename
    }

    if (originalFileToSave) {
      files.push(originalFileToSave)
    }
  }

  if (main.transformedBuffer) {
    // The stored bytes are no longer the ones the client uploaded, so the client's upload
    // reference must not be reused for them.
    delete file.uploadReference

    files.push({
      buffer: main.transformedBuffer,
      path: `${staticDir}/${filename}`,
      role: { type: 'default' },
    })
    await syncRequestFile({ buffer: main.transformedBuffer, file, req })
  } else if (!reusedOriginal && !isProviderObjectMain) {
    const untransformedMainFile = await getUntransformedMainFileToSave({
      collection,
      file,
      filename,
      shouldStageCloudFiles,
    })

    if (untransformedMainFile) {
      files.push(untransformedMainFile)

      if ('buffer' in untransformedMainFile && untransformedMainFile.buffer.length > 0) {
        // Keep req.file in sync, since downstream hooks/plugins may read it.
        await syncRequestFile({ buffer: untransformedMainFile.buffer, file, req })
      }
    }
  }

  if (sizeResults.length > 0) {
    const sizes = await buildVariantOutputs({
      collection,
      currentFileData,
      excludeDocumentID: ownDocumentID,
      filename,
      mainMimeType: main.mimeType,
      objectKey: newObjectKey,
      originalFilename: fileData.original?.filename,
      prefix,
      req,
      shouldStageCloudFiles,
      sizeResults,
      storedPrefix: providerOriginal?.prefix ?? currentFileData?.prefix,
    })

    req.payloadUploadSizes = sizes.sizeBuffers
    fileData.variants = sizes.variants
    files.push(...sizes.files)
  }

  if (isAppliedAtRequest && fileData.original) {
    // The saved upload is the original. No default file is stored.
    Object.assign(
      fileData,
      getRequestTimeDefaultFileData({
        original: fileData.original,
        transforms: pipelineDoc._transforms,
      }),
    )
    for (const fileToSave of files) {
      if (fileToSave.role?.type === 'default') {
        fileToSave.role = { type: 'original' }
      }
    }
  } else if (isRequestTimeFile({ entry: currentFileData })) {
    // The default file is stored again, so it is no longer built at request time.
    fileData._stored = null
  }

  // A bridge stores only the sizes it owns. Otherwise the transformer that registered the sizes
  // builds each one from the original when it is requested, if it runs at request time. A planned
  // bridge does not run when the saved keys are applied at request time.
  const variantsTransformerSlug = collection.upload.variantsTransformerSlug

  if (
    (collection.upload.variants ?? []).length > 0 &&
    variantsTransformerSlug &&
    transformed?.bridgeTransformer?.slug !== variantsTransformerSlug &&
    fileData.original &&
    (await canBuildAtRequest({
      collectionSlug: collection.slug,
      documentID,
      mimeType: file.mimetype,
      pipelineDoc,
      pipelineOriginalDoc,
      req,
      requiredTransformerSlug: variantsTransformerSlug,
    }))
  ) {
    fileData.variants = await getRequestTimeVariants({
      collection,
      documentID,
      filename: fileData.filename!,
      original: fileData.original,
      prefix,
      req,
      staticPath: disableLocalStorage ? undefined : staticDir!,
    })
  }

  return { fileData, files }
}

/** The saved fields when the retained original becomes the main file again, as on a crop reset. */
function getRetainedOriginalFileData({
  currentFileData,
  retainedOriginal,
}: {
  currentFileData?: FileData
  retainedOriginal: OriginalFileData
}): Partial<FileData> {
  return {
    _objectKey: retainedOriginal._objectKey,
    filename: retainedOriginal.filename,
    filesize: retainedOriginal.filesize,
    height: retainedOriginal.height!,
    mimeType: retainedOriginal.mimeType,
    original: retainedOriginal,
    prefix: retainedOriginal.prefix,
    url: retainedOriginal.url,
    variants: currentFileData?.variants,
    width: retainedOriginal.width!,
    ...(isRequestTimeFile({ entry: currentFileData }) ? { _stored: null } : {}),
  }
}

/**
 * The main file's type, size and dimensions, and the name it would be saved as. A transformed
 * file is read into memory; an untransformed one is not.
 */
async function describeMainFile({
  file,
  shouldProbeDimensions,
  transformedMainFile,
}: {
  file: IncomingFile
  /** False when the upload bridge gave the dimensions. */
  shouldProbeDimensions: boolean
  transformedMainFile?: File
}): Promise<{
  dimensions?: { height: number; width: number }
  /** The sanitized name, before name clashes are checked. */
  filename: string
  filesize: number
  mimeType: string
  transformedBuffer?: Buffer
}> {
  const transformedBuffer = transformedMainFile
    ? Buffer.from(await transformedMainFile.arrayBuffer())
    : undefined
  // A transformed file is named after what the transformer returned, not the upload.
  const outputName = transformedMainFile?.name || file.name

  let mimeType: string
  let ext: string | undefined

  if (transformedBuffer) {
    // Detected bytes win for binary formats (Sharp keeps the input's name and type on a
    // converted output), but text-like output such as CSV has no signature to detect, so
    // fall back to the type and extension the transformer declared on the returned File.
    const typeResult = await fileTypeFromBuffer(transformedBuffer)
    ext = typeResult?.ext ?? (getFileExtension(getSanitizedUploadFilename(outputName)) || undefined)
    mimeType = typeResult?.mime ?? (transformedMainFile!.type || file.mimetype)
  } else {
    mimeType = file.mimetype
    ext = getFileExtension(getSanitizedUploadFilename(file.name))
  }

  // Adjust SVG mime type. fromBuffer modifies it.
  if (mimeType === 'application/xml' && ext === 'svg') {
    mimeType = 'image/svg+xml'
  }

  let dimensions: { height: number; width: number } | undefined

  // Only probe formats that could carry dimensions - probing reads the file, and a large
  // non-image upload may only exist as a temp file we deliberately never buffer.
  if (shouldProbeDimensions && isProcessableImage(mimeType)) {
    try {
      const probed = await getImageSize({
        file: transformedBuffer
          ? { ...file, data: transformedBuffer, tempFilePath: undefined }
          : file,
      })
      dimensions = { height: probed.height, width: probed.width }
    } catch {
      // Not a recognized image format — leave width/height unset.
    }
  }

  return {
    dimensions,
    filename: getSanitizedUploadFilename(outputName, ext),
    filesize: transformedBuffer ? transformedBuffer.length : file.size,
    mimeType,
    transformedBuffer,
  }
}

/**
 * The `original` entry of the new file, and the original file to store. The original is stored
 * separately only when a stage changed the main file. A retained original and an original the
 * client uploaded to the provider are kept as they are.
 */
async function buildOriginalOutput({
  collection,
  currentFileData,
  excludeDocumentID,
  file,
  mainFilename,
  newObjectKey,
  prefix,
  providerOriginal,
  req,
  retainedOriginal,
  transformed,
}: {
  collection: SanitizedCollectionConfig
  currentFileData?: FileData
  excludeDocumentID?: number | string
  file: IncomingFile
  mainFilename: string
  newObjectKey?: string
  prefix?: string
  providerOriginal?: UploadStorage['providerOriginal']
  req: PayloadRequest
  retainedOriginal?: OriginalFileData
  transformed?: UploadTransformerOutput
}): Promise<{ original: OriginalFileData; originalFileToSave?: FileToSave }> {
  const staticPath = collection.upload.staticDir
  const isTransformed = Boolean(transformed?.transformedMainFile)
  const originalFilename =
    retainedOriginal?.filename ??
    providerOriginal?.filename ??
    (isTransformed
      ? await getUnplannedSafeFileName({
          // Without its own storage folder, the original cannot reuse the main file's name.
          canUseName: (name) => Boolean(newObjectKey) || name !== mainFilename,
          collectionSlug: collection.slug,
          desiredFilename: getSanitizedUploadFilename(file.name),
          excludeDocumentID,
          prefix,
          req,
          staticPath: staticPath!,
        })
      : mainFilename)
  // A transformed original is a separate object, so it gets its own folder.
  const originalObjectKey = isTransformed && newObjectKey ? randomUUID() : newObjectKey
  const original = retainedOriginal ?? {
    _objectKey: providerOriginal ? providerOriginal._objectKey : originalObjectKey,
    filename: originalFilename,
    filesize: file.size,
    mimeType: file.mimetype,
    prefix: providerOriginal?.prefix ?? currentFileData?.prefix,
    url: formatAdminURL({
      apiRoute: req.payload.config.routes.api,
      path: `/${collection.slug}/file/${encodeURIComponent(originalFilename)}`,
      relative: true,
      serverURL: req.payload.config.serverURL,
    }),
  }

  if (!retainedOriginal && isProcessableImage(file.mimetype)) {
    try {
      const dimensions = await getImageSize({ file })
      original.width = dimensions.width
      original.height = dimensions.height
    } catch {
      // Files with an image MIME type may not have readable dimensions.
    }
  }

  return {
    original,
    originalFileToSave:
      isTransformed && !retainedOriginal && !providerOriginal
        ? {
            buffer: Buffer.from(await transformed!.originalFile.arrayBuffer()),
            path: `${staticPath}/${originalFilename}`,
            role: { type: 'original' },
          }
        : undefined,
  }
}

/**
 * The main file to store when no stage changed it. A temp file is copied as it is, and is not
 * read when local storage is disabled (see `resolveTempFileHandling`). A partial probe of a client
 * upload is never stored.
 */
async function getUntransformedMainFileToSave({
  collection,
  file,
  filename,
  shouldStageCloudFiles,
}: {
  collection: SanitizedCollectionConfig
  file: IncomingFile
  filename: string
  shouldStageCloudFiles: boolean
}): Promise<FileToSave | undefined> {
  const path = `${collection.upload.staticDir}/${filename}`
  // file.data is empty when useTempFiles is on, so the real content lives at file.tempFilePath.
  const tempFileHandling = resolveTempFileHandling({
    disableLocalStorage: Boolean(collection.upload.disableLocalStorage) && !shouldStageCloudFiles,
    hasProcessedBuffer: false,
    tempFilePath: file.tempFilePath,
  })

  if (tempFileHandling.type === 'copyFromTempFile') {
    return { path, role: { type: 'default' }, sourcePath: tempFileHandling.sourcePath }
  }

  if (tempFileHandling.type === 'skip') {
    return undefined
  }

  const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data
  // A 'header'/'none' content requirement (see getFileContentRequirement.ts) means file.data is
  // only a partial probe, not the real content - never save it as-is.
  const isPartialProbe = !file.tempFilePath && buffer.length !== file.size

  return isPartialProbe ? undefined : { buffer, path, role: { type: 'default' } }
}

/**
 * Puts the stored main file's bytes where hooks and storage plugins read the upload: in the temp
 * file when there is one, otherwise in `req.file`.
 */
async function syncRequestFile({
  buffer,
  file,
  req,
}: {
  buffer: Buffer
  file: IncomingFile
  req: PayloadRequest
}): Promise<void> {
  if (file.tempFilePath) {
    await fs.writeFile(file.tempFilePath, buffer)
  } else {
    req.file = { ...file, data: buffer, size: buffer.length }
  }
}
