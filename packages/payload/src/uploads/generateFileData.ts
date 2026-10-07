import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

import type { Collection, TypeWithID } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { ExternalUploadSource } from './sanitizeUploadData.js'
import type { FileSource, PlannedTransformer } from './transformers/types.js'
import type { PreparedUploadTransformation } from './transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave, UploadEdits } from './types.js'

import {
  FileRetrievalError,
  FileUploadError,
  Forbidden,
  MissingFile,
  ValidationError,
} from '../errors/index.js'
import { formatAdminURL } from '../utilities/formatAdminURL.js'
import { canResizeImage } from './canResizeImage.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { downloadFileToBuffer } from './downloadFileToBuffer.js'
import { getOriginalFilename } from './fileVersioning/naming.js'
import { generateFilePathOrURL } from './generateFilePathOrURL.js'
import { generateImageSizeFilename } from './generateImageSizeFilename.js'
import { getFileByPath } from './getFileByPath.js'
import { getFileExtension, getSanitizedUploadFilename } from './getFileTypeIdentity.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName, incrementName } from './getSafeFilename.js'
import { hasFullFileContents } from './hasFullFileContents.js'
import { isProcessableImage } from './isProcessableImage.js'
import { parseFilename } from './parseFilename.js'
import { createDocumentSnapshot } from './transformers/createDocumentSnapshot.js'
import { createFileSource } from './transformers/createFileSource.js'
import { createUploadFileSource } from './transformers/createUploadFileSource.js'
import { matchesMimeType } from './transformers/matchesMimeType.js'
import { planTransformerPipeline } from './transformers/planTransformerPipeline.js'
import { transformUploadFile } from './transformers/transformUploadFile.js'
import {
  getUploadTransformerInternal,
  setUploadFilePath,
} from './transformers/uploadTransformerBridge.js'
import { assertTransformCoverage } from './transformState/assertTransformCoverage.js'
import { resolveTransformStateWrite } from './transformState/resolveTransformStateWrite.js'
import { validateTransformState } from './transformState/validateTransformState.js'
import { validateTransformedDocument } from './validateTransformedDocument.js'
type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
  draft?: boolean
  externalUploadSource?: ExternalUploadSource
  isDuplicating?: boolean
  isReplayRequired?: boolean
  operation: 'create' | 'update'
  originalDoc?: T
  overrideAccess?: boolean
  overwriteExistingFiles?: boolean
  req: PayloadRequest
  throwOnMissingFile?: boolean
}

type Result<T> = Promise<{
  data: T
  files: FileToSave[]
}>

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
  isReplayRequired = false,
  operation,
  originalDoc,
  overrideAccess = false,
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

  const hasSubmittedTransformState = Object.prototype.hasOwnProperty.call(data, '_transforms')
  const transformStateWrite = resolveTransformStateWrite({
    data,
    isReplacingOriginal: Boolean(file || externalUploadSource),
    originalDoc: originalDoc ?? (isDuplicating ? data : undefined),
  })

  transformStateWrite.hasChanged ||= isReplayRequired

  if (transformStateWrite.shouldValidate || isReplayRequired) {
    validateTransformState({
      collectionSlug: collectionConfig.slug,
      doc: file || externalUploadSource ? undefined : originalDoc,
      req,
      value: transformStateWrite.value,
    })
  }

  data = {
    ...data,
    _transforms: transformStateWrite.value,
    ...(hasSubmittedTransformState || file || externalUploadSource
      ? { focalX: null, focalY: null }
      : {}),
  }

  const uploadEdits = getCanonicalUploadEdits({ data, operation })

  const { disableLocalStorage, staticDir } = collectionConfig.upload
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

  const incomingFileData: Document = isDuplicating ? { ...originalDoc, ...data } : data
  const validationBaseline = structuredClone(incomingFileData)
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
  const fileSourceData = isDuplicating
    ? (currentFileData?.original ?? currentFileData)
    : (externalUploadSource ?? retainedOriginal ?? currentFileData)
  let isLocalFile = false
  let replayPipeline: PlannedTransformer[] | undefined
  let replaySource: FileSource | undefined

  if (!file && retainedOriginal && transformStateWrite.hasChanged) {
    const candidate = { ...currentFileData, ...incomingFileData }

    replayPipeline = await planTransformerPipeline({
      args: {
        collectionSlug: collectionConfig.slug,
        doc: candidate,
        operation: 'upload',
        originalDoc: createDocumentSnapshot({ doc: candidate }),
        req,
      },
      capability: 'transformFile',
      mimeType: retainedOriginal.mimeType,
      transformers: req.payload.config.upload?.transformers ?? [],
    })

    if (candidate._transforms && replayPipeline.length) {
      assertTransformCoverage({ pipeline: replayPipeline, state: candidate._transforms })
    }
  }

  if (isDuplicating && incomingFileData._transforms) {
    const duplicateMimeType = currentFileData?.original?.mimeType ?? currentFileData?.mimeType
    const candidate = structuredClone({ ...incomingFileData, mimeType: duplicateMimeType })
    const originalSnapshot = createDocumentSnapshot({ doc: candidate })
    replayPipeline = await planTransformerPipeline({
      args: {
        collectionSlug: collectionConfig.slug,
        doc: candidate,
        operation: 'upload',
        originalDoc: originalSnapshot,
        req,
      },
      capability: 'transformFile',
      mimeType: duplicateMimeType,
      transformers: req.payload.config.upload?.transformers ?? [],
    })
    const coveragePipeline = replayPipeline.length
      ? replayPipeline
      : await planTransformerPipeline({
          args: {
            collectionSlug: collectionConfig.slug,
            doc: candidate,
            operation: 'request',
            originalDoc: originalSnapshot,
            purpose: 'persisted-default',
            req,
          },
          capability: 'handleRequest',
          mimeType: duplicateMimeType,
          transformers: req.payload.config.upload?.transformers ?? [],
        })

    assertTransformCoverage({ pipeline: coveragePipeline, state: incomingFileData._transforms })
  }

  if (
    !file &&
    fileSourceData &&
    (externalUploadSource || isDuplicating || Boolean(replayPipeline?.length))
  ) {
    const { filename, url } = fileSourceData
    if (filename && (filename.includes('../') || filename.includes('..\\'))) {
      throw new Forbidden(req.t)
    }

    if ((serverURL && url?.startsWith(serverURL)) || url?.startsWith('/')) {
      isLocalFile = true
    }

    try {
      if (retainedOriginal) {
        const filePath = `${staticPath}/${filename}`
        replaySource = createFileSource({
          filename,
          mimeType: retainedOriginal.mimeType,
          retrieve: async () => {
            if (!disableLocalStorage && isLocalFile) {
              return new Response(
                Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>,
              )
            }
            const { retrieveFileResponse } = await import('./endpoints/getFile.js')

            return retrieveFileResponse({
              collection: { config: collectionConfig },
              doc: originalDoc as TypeWithID,
              filename,
              operation: 'transform',
              req,
            })
          },
          size: retainedOriginal.filesize,
        })
        file = {
          name: filename,
          data: Buffer.alloc(0),
          mimetype: retainedOriginal.mimeType,
          size: retainedOriginal.filesize,
        }
        overwriteExistingFiles = true
      } else if (!externalUploadSource && !disableLocalStorage && isLocalFile) {
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

    if (retainedOriginal && transformStateWrite.hasChanged && !replayPipeline?.length) {
      const candidate = { ...currentFileData, ...incomingFileData }
      const state = transformStateWrite.value
      const hasSavedIntent = Boolean(state && Object.keys(state).length)

      if (hasSavedIntent) {
        const pipeline = await planTransformerPipeline({
          args: {
            collectionSlug: collectionConfig.slug,
            doc: candidate,
            operation: 'request',
            originalDoc: createDocumentSnapshot({ doc: candidate }),
            purpose: 'persisted-default',
            req,
          },
          capability: 'handleRequest',
          mimeType: retainedOriginal.mimeType,
          transformers: req.payload.config.upload?.transformers ?? [],
        })

        assertTransformCoverage({ pipeline, state: candidate._transforms })
      }

      const { name: stem, ext } = parseFilename(retainedOriginal.filename)
      const logicalFilename = hasSavedIntent
        ? candidate.filename !== retainedOriginal.filename
          ? candidate.filename
          : await getSafeFileName({
              collectionSlug: collectionConfig.slug,
              desiredFilename: `${stem}-default${ext ? `.${ext}` : ''}`,
              prefix: candidate.prefix,
              req,
              staticPath,
            })
        : retainedOriginal.filename

      return {
        data: {
          ...candidate,
          _objectKey: hasSavedIntent ? null : retainedOriginal._objectKey,
          filename: logicalFilename,
          filesize: hasSavedIntent ? null : retainedOriginal.filesize,
          height: hasSavedIntent ? null : retainedOriginal.height,
          mimeType: hasSavedIntent
            ? (candidate.mimeType ?? retainedOriginal.mimeType)
            : retainedOriginal.mimeType,
          original: retainedOriginal,
          url: undefined,
          variants: hasSavedIntent
            ? getLogicalVariants({ collection: collectionConfig, filename: logicalFilename })
            : getLogicalVariants({
                collection: collectionConfig,
                filename: logicalFilename,
                shouldClear: true,
              }),
          width: hasSavedIntent ? null : retainedOriginal.width,
        } as T,
        files: [],
      }
    }

    return {
      data: incomingFileData!,
      files: [],
    }
  }

  const detectedFileType = replaySource
    ? undefined
    : await checkFileRestrictions({
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
  let isRequestOnlyDefault = false
  let expectedDefaultMimeType: string | undefined

  try {
    const workingDoc = structuredClone({
      ...currentFileData,
      ...incomingFileData,
      mimeType: file.mimetype,
    })

    if (!retainedOriginal && (req.file || externalUploadSource)) {
      let dimensions: { height: number; width: number } | undefined

      if (canResizeImage(file.mimetype)) {
        try {
          dimensions = await getImageSize({ file })
        } catch {
          // An unrecognized image has no known bounds; its adapter validates the source.
        }
      }

      workingDoc.original = {
        filename: file.name,
        filesize: file.size,
        mimeType: file.mimetype,
        ...dimensions,
      }
    }

    if (transformStateWrite.shouldValidate) {
      validateTransformState({
        collectionSlug: collectionConfig.slug,
        doc: workingDoc,
        req,
        value: workingDoc._transforms,
      })
    }
    const pipelineOriginalDoc = createDocumentSnapshot({ doc: workingDoc })
    const plannedPipeline =
      replayPipeline ??
      (await planTransformerPipeline({
        args: {
          collectionSlug: collectionConfig.slug,
          doc: workingDoc,
          operation: 'upload',
          originalDoc: pipelineOriginalDoc,
          req,
        },
        capability: 'transformFile',
        transformers: req.payload.config.upload?.transformers ?? [],
      }))

    const originalSource =
      replaySource ??
      createUploadFileSource({
        collectionSlug: collectionConfig.slug,
        file,
        req,
      })
    // The legacy variants bridge needs a complete input; public stages consume lazy sources.
    const pipeline = plannedPipeline.filter(
      ({ transformer }) =>
        Boolean(replaySource) ||
        hasFullFileContents(file) ||
        !getUploadTransformerInternal(transformer)?.prepareUpload,
    )
    const canRunTransformers = pipeline.length > 0
    isRequestOnlyDefault =
      !canRunTransformers &&
      Boolean(workingDoc._transforms && Object.keys(workingDoc._transforms).length)

    if (isRequestOnlyDefault) {
      const requestPipeline = await planTransformerPipeline({
        args: {
          collectionSlug: collectionConfig.slug,
          doc: workingDoc,
          operation: 'request',
          originalDoc: pipelineOriginalDoc,
          purpose: 'persisted-default',
          req,
        },
        capability: 'handleRequest',
        mimeType: originalSource.mimeType,
        transformers: req.payload.config.upload?.transformers ?? [],
      })

      assertTransformCoverage({ pipeline: requestPipeline, state: workingDoc._transforms })
      expectedDefaultMimeType = workingDoc.mimeType
    }

    if (canRunTransformers && workingDoc._transforms) {
      assertTransformCoverage({ pipeline, state: workingDoc._transforms })
    }

    const bridgeTransformers = canRunTransformers
      ? pipeline.filter(
          ({ transformer }) =>
            Boolean(getUploadTransformerInternal(transformer)?.prepareUpload) &&
            transformer.mimeTypes.some((pattern) =>
              matchesMimeType({ mimeType: originalSource.mimeType, pattern }),
            ),
        )
      : []

    const bridgeTransformer =
      bridgeTransformers.find(({ transformer }) =>
        getUploadTransformerInternal(transformer)!.handlesCollection?.({
          collectionSlug: collectionConfig.slug,
        }),
      ) ?? bridgeTransformers[0]

    // The chosen bridge's task options are private to it, so other bridges must not see them.
    const bridgeTaskPipeline = pipeline.filter(
      (stage) => stage === bridgeTransformer || !bridgeTransformers.includes(stage),
    )

    let originalWebFile: File | undefined
    let mainWebFile: File | undefined
    let hasDimensionsFromBridge = false
    let sizeResults: PreparedUploadTransformation[] = []

    if (canRunTransformers) {
      if (bridgeTransformer) {
        const bridge = getUploadTransformerInternal(bridgeTransformer.transformer)!
        originalWebFile = new File(
          [
            Buffer.from(
              await originalSource.arrayBuffer({
                maxBytes: bridge.maxSourceBytes ?? 64 * 1024 * 1024,
              }),
            ),
          ],
          file.name,
          { type: file.mimetype },
        )
        if (file.tempFilePath) {
          setUploadFilePath(originalWebFile, file.tempFilePath)
        }
        const results = await bridge.prepareUpload!({
          collectionSlug: collectionConfig.slug,
          doc: workingDoc,
          file: originalWebFile,
          req,
          transform: (task) =>
            transformUploadFile({
              collectionSlug: collectionConfig.slug,
              doc: task.fieldPath === 'filename' ? workingDoc : structuredClone(workingDoc),
              file: task.file ?? originalWebFile!,
              originalDoc: pipelineOriginalDoc,
              originalSource,
              pipeline: (task.fieldPath === 'filename'
                ? bridgeTaskPipeline
                : [bridgeTransformer]
              ).map((stage) =>
                stage === bridgeTransformer ? { ...stage, options: task.options } : stage,
              ),
              req,
              transformers: (task.fieldPath === 'filename'
                ? (req.payload.config.upload?.transformers ?? [])
                : [bridgeTransformer.transformer]
              ).filter(
                (transformer) =>
                  Boolean(replaySource) ||
                  hasFullFileContents(file) ||
                  !getUploadTransformerInternal(transformer)?.prepareUpload,
              ),
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
          doc: workingDoc,
          originalDoc: pipelineOriginalDoc,
          pipeline,
          req,
          source: originalSource,
          transformers: (req.payload.config.upload?.transformers ?? []).filter(
            (transformer) =>
              Boolean(replaySource) ||
              hasFullFileContents(file) ||
              !getUploadTransformerInternal(transformer)?.prepareUpload,
          ),
        })
      }
    }

    newData = { ...incomingFileData, ...workingDoc } as T

    if (mainWebFile && workingDoc._transforms) {
      validateTransformState({
        collectionSlug: collectionConfig.slug,
        doc: workingDoc,
        req,
        value: workingDoc._transforms,
      })
    }

    const fileWasTransformed = Boolean(mainWebFile && mainWebFile !== originalWebFile)
    const hasReusableOriginalMain = Boolean(retainedOriginal && !fileWasTransformed)
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
    if (replaySource && !mainBuffer) {
      fileData.width = retainedOriginal?.width ?? undefined
      fileData.height = retainedOriginal?.height ?? undefined
    }
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
    fileData.url =
      generateFilePathOrURL({
        collectionSlug: collectionConfig.slug,
        config: req.payload.config,
        filename: fsSafeName,
        relative: true,
        urlOrPath: undefined,
      }) ?? undefined
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
          buffer: Buffer.from(await originalSource.arrayBuffer({ maxBytes: file.size })),
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
          url: generateFilePathOrURL({
            collectionSlug: collectionConfig.slug,
            config: req.payload.config,
            filename: imageName,
            relative: true,
            urlOrPath: undefined,
          }),
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
    if (err instanceof ValidationError) {
      throw err
    }
    req.payload.logger.error(err)
    throw new FileUploadError(req.t)
  }

  const urlField = collectionConfig.flattenedFields?.find((field) => field.name === 'url')
  if (urlField?.localized && 'url' in fileData && req.payload.config.localization) {
    const priorURLs = (newData as Document).url
    const locale =
      req.locale === 'all'
        ? req.payload.config.localization.defaultLocale
        : (req.locale ?? req.payload.config.localization.defaultLocale)

    ;(fileData as Document).url = {
      ...(typeof priorURLs === 'object' && priorURLs !== null ? priorURLs : {}),
      [locale]: fileData.url,
    }
  }

  newData = {
    ...newData,
    ...fileData,
    ...(draft ? { _status: 'draft' } : {}),
  }

  if (isRequestOnlyDefault && fileData.original) {
    const { name: stem, ext } = parseFilename(fileData.original.filename)
    const filename = await getSafeFileName({
      collectionSlug: collectionConfig.slug,
      desiredFilename: `${stem}-default${ext ? `.${ext}` : ''}`,
      prefix: (newData as Document).prefix,
      req,
      staticPath,
    })

    newData = {
      ...newData,
      _objectKey: null,
      filename,
      filesize: null,
      height: null,
      mimeType: expectedDefaultMimeType,
      url: null,
      variants: getLogicalVariants({ collection: collectionConfig, filename }),
      width: null,
    }
  }

  validateTransformState({
    collectionSlug: collectionConfig.slug,
    doc: newData,
    req,
    value: (newData as Document)._transforms,
  })
  await validateTransformedDocument({
    collection: collectionConfig,
    doc: newData,
    operation,
    originalDoc: validationBaseline,
    overrideAccess,
    req,
  })

  return {
    data: newData,
    files: filesToSave,
  }
}

function getCanonicalUploadEdits({
  data,
  operation,
}: {
  data: unknown
  operation: 'create' | 'update'
}): UploadEdits {
  const focalPoint = (data as FileData)?._transforms?.focalPoint

  return focalPoint
    ? { focalPoint }
    : operation === 'create'
      ? { focalPoint: { x: 50, y: 50 } }
      : {}
}

function getLogicalVariants({
  collection,
  filename,
  shouldClear = false,
}: {
  collection: Collection['config']
  filename: string
  shouldClear?: boolean
}): FileSizes {
  const { name: stem, ext } = parseFilename(filename)

  return Object.fromEntries(
    (collection.upload.variants ?? []).map(({ name }) => [
      name,
      {
        filename: shouldClear
          ? null
          : getSanitizedUploadFilename(`${stem}-${name}${ext ? `.${ext}` : ''}`),
        filesize: null,
        height: null,
        mimeType: null,
        url: null,
        width: null,
      },
    ]),
  ) as FileSizes
}
