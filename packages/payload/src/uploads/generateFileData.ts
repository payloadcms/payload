import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs/promises'
import { randomUUID } from 'node:crypto'
import { openAsBlob } from 'node:fs'

import type {
  Collection,
  SanitizedCollectionConfig,
  TypeWithID,
} from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'
import type { ExternalUploadSource } from './sanitizeUploadData.js'
import type { PreparedUploadTransformation } from './transformers/uploadTransformerBridge.js'
import type { FileData, FileSizes, FileToSave, UploadEdits } from './types.js'

import {
  FileRetrievalError,
  FileUploadError,
  Forbidden,
  MissingFile,
  ValidationError,
} from '../errors/index.js'
import { TransformerContractError } from '../errors/TransformerContractError.js'
import { deepCopyObject } from '../utilities/deepCopyObject.js'
import { deepFreeze } from '../utilities/deepFreeze.js'
import { formatAdminURL } from '../utilities/formatAdminURL.js'
import { isNumber } from '../utilities/isNumber.js'
import { canResizeImage } from './canResizeImage.js'
import { checkFileRestrictions } from './checkFileRestrictions.js'
import { downloadFileToBuffer, resolveExternalFileURL } from './downloadFileToBuffer.js'
import { generateImageSizeFilename } from './generateImageSizeFilename.js'
import { getFileByPath } from './getFileByPath.js'
import { fetchFullClientUpload as downloadFullClientUpload } from './getFileFromUploadInstructions.js'
import { getFileExtension, getSanitizedUploadFilename } from './getFileTypeIdentity.js'
import { getImageSize } from './getImageSize.js'
import { getSafeFileName, incrementName } from './getSafeFilename.js'
import { hasCropOrResizeEdit } from './hasCropOrResizeEdit.js'
import { hasFullFileContents } from './hasFullFileContents.js'
import { isProcessableImage } from './isProcessableImage.js'
import { parseFilename } from './parseFilename.js'
import { transformUploadFile } from './transformers/transformUploadFile.js'
import {
  getUploadTransformerInternal,
  setUploadFilePath,
} from './transformers/uploadTransformerBridge.js'
import { isFullCrop } from './transformState/cropUnits.js'
import {
  assertTransformKeysCovered,
  getStagesThatRun,
  planUploadPipeline,
  planUploadRebuild,
} from './transformState/planUpload.js'
import { resolveUploadEdits, withSavedEdits } from './transformState/resolveUploadEdits.js'
import { isClaimRequired, isFocalPointKey } from './transformState/transformKeyClaims.js'
import { validateUploadURL } from './validateUploadURL.js'
type Args<T> = {
  collection: Collection
  config: SanitizedConfig
  data: T
  draft?: boolean
  externalUploadSource?: ExternalUploadSource
  /**
   * Downloads a client upload that arrived without its whole contents. Defaults to
   * `fetchFullClientUpload`. A bulk update passes a shared download, so its documents download
   * the file once.
   */
  fetchFullClientUpload?: typeof downloadFullClientUpload
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

type ProcessUploadResult<T> = Promise<{
  data: T
  files: FileToSave[]
  /** The final `_transforms` of the transformer `doc`, after every stage ran. */
  transforms: Document['_transforms']
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
export const generateFileData = async <T>(args: Args<T>): Result<T> => {
  const { collection, data, isDuplicating, operation, originalDoc, req } = args

  if (!collection.config.upload) {
    return {
      data,
      files: [],
    }
  }

  const editArgs = {
    collectionSlug: collection.config.slug,
    data,
    focalPointEnabled: collection.config.upload.focalPoint !== false,
    isDuplicating,
    operation,
    originalDoc,
    req,
  }
  // Transformers get the document as the operation would save it, and may change only its
  // `_transforms`. File processing runs before the hooks and validation, so those then run on
  // the transformers' changes.
  const docToSave =
    operation === 'update' ? { ...originalDoc, ...data } : isDuplicating ? originalDoc : data
  // A create from a URL reads its file later, so a saved crop is checked once the file is read.
  let edits = await resolveUploadEdits({
    ...editArgs,
    canWaitForFile: operation === 'create' && !req.file,
  })
  const hasTransformers = hasUploadTransformers({ req })
  // Without transformers nothing reads or changes the doc, so a shallow copy is enough.
  const createPipelineDoc = (): Document => {
    const doc = edits.applyTransformState(docToSave)

    return hasTransformers ? deepCopyObject(doc) : { ...doc }
  }
  const { transforms, ...result } = await processUpload({
    ...args,
    hasTransformers,
    pipelineDoc: createPipelineDoc(),
    resolveEditsForFile: edits.isWaitingForFile
      ? async (file) => {
          edits = await resolveUploadEdits({ ...editArgs, file })
          return { pipelineDoc: createPipelineDoc(), uploadEdits: edits.uploadEdits }
        }
      : undefined,
    uploadEdits: edits.uploadEdits,
  })

  if (edits.isWaitingForFile) {
    // No file was read, so the crop cannot be checked. This throws its validation error.
    edits = await resolveUploadEdits(editArgs)
  }

  // A stage can change the focal point, so focalX and focalY follow the final value, rounded as
  // `resolveUploadEdits` rounds them.
  const finalFocalPoint = (transforms as { focalPoint?: { x: number; y: number } } | null)
    ?.focalPoint
  const focalFields =
    editArgs.focalPointEnabled && finalFocalPoint
      ? { focalX: Math.round(finalFocalPoint.x), focalY: Math.round(finalFocalPoint.y) }
      : {}

  return {
    ...result,
    data: {
      ...edits.applyTransformState(result.data),
      ...focalFields,
      _transforms: transforms ?? null,
    },
  }
}

const processUpload = async <T>({
  collection: { config: collectionConfig },
  data,
  draft,
  externalUploadSource,
  fetchFullClientUpload = downloadFullClientUpload,
  hasTransformers,
  isDuplicating,
  operation,
  originalDoc,
  overwriteExistingFiles,
  pipelineDoc: initialPipelineDoc,
  req,
  resolveEditsForFile,
  throwOnMissingFile,
  uploadEdits: initialUploadEdits,
}: {
  /** Whether any transformer is configured. Without one, the document is not copied. */
  hasTransformers: boolean
  pipelineDoc: Document
  /**
   * Resolves the edits again for a file read during the operation, before any transformer runs.
   * The transformer `doc` holds the resolved `_transforms`, so it is built again too.
   */
  resolveEditsForFile?: (
    file: NonNullable<PayloadRequest['file']>,
  ) => Promise<{ pipelineDoc: Document; uploadEdits: UploadEdits }>
  uploadEdits: UploadEdits
} & Args<T>): ProcessUploadResult<T> => {
  let pipelineDoc = initialPipelineDoc
  let uploadEdits = initialUploadEdits
  if (!collectionConfig.upload) {
    return {
      data,
      files: [],
      transforms: pipelineDoc._transforms,
    }
  }

  const { serverURL } = req.payload.config

  let file = isDuplicating ? undefined : req.file

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

  const storedMimeType = retainedOriginal?.mimeType ?? currentFileData?.mimeType
  // A rebuild reads the retained original, so planning sees its size and type, as the stages
  // will after the read. The name stays the main file's, as for the file that is read.
  if (retainedOriginal) {
    pipelineDoc.filesize = retainedOriginal.filesize
    pipelineDoc.mimeType = retainedOriginal.mimeType
  }
  // Only transformers read originalDoc, so it is copied only when there are some.
  const createOriginalDoc = (): Readonly<Document> =>
    hasTransformers ? deepFreeze(deepCopyObject(pipelineDoc)) : pipelineDoc
  let pipelineOriginalDoc = createOriginalDoc()
  const rebuildPlanning =
    file || !fileSourceData
      ? { rebuildPlan: undefined, shouldRebuild: false }
      : await planUploadRebuild({
          collectionSlug: collectionConfig.slug,
          // Not `uploadEdits`: a focal point change copies the saved crop into it, so the crop is
          // applied again if the file is rebuilt. That copy is not a crop edit.
          hasCropOrFocalPointEdit: shouldReupload(
            uploadEdits,
            incomingFileData as Record<string, unknown>,
          ),
          hasCropOrResizeEdit: hasCropOrResizeEdit(
            req.query?.uploadEdits as undefined | UploadEdits,
          ),
          isDuplicating: Boolean(isDuplicating),
          isExternalSource: Boolean(externalUploadSource),
          pipelineDoc,
          pipelineOriginalDoc,
          previousTransforms:
            operation === 'update'
              ? ((originalDoc as Document | undefined)?._transforms ?? null)
              : undefined,
          req,
          storedMimeType,
        }).catch((err: unknown) => {
          throw toFileUploadError({ err, req })
        })
  const { shouldRebuild } = rebuildPlanning
  let { rebuildPlan } = rebuildPlanning

  if (shouldRebuild && retainedOriginal) {
    uploadEdits = withSavedEdits({
      edits: uploadEdits,
      original: retainedOriginal,
      transforms: pipelineDoc._transforms,
    })
  }

  if (shouldRebuild && fileSourceData) {
    const { filename, url } = fileSourceData
    if (filename && (filename.includes('../') || filename.includes('..\\'))) {
      throw new Forbidden(req.t)
    }

    if ((serverURL && url?.startsWith(serverURL)) || url?.startsWith('/')) {
      isLocalFile = true
    }

    // A caller-supplied URL must pass the same `pasteURL` policy as the paste-url endpoint.
    // Checked outside the try below so policy errors reach the caller as 400s.
    if (externalUploadSource) {
      validateUploadURL({
        requireAllowList: false,
        uploadConfig: collectionConfig.upload,
        url: resolveExternalFileURL({ req, url: externalUploadSource.url }).url.href,
      })
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
          isOriginal: true,
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

    // A stored file whose type cannot be detected from its bytes or extension keeps the type
    // saved on the document.
    if (file && !file.mimetype && storedMimeType) {
      file = { ...file, mimetype: storedMimeType }
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
      transforms: pipelineDoc._transforms,
    }
  }

  file = await checkFileAndUseDetectedType({ collection: collectionConfig, file, req })

  if (resolveEditsForFile) {
    ;({ pipelineDoc, uploadEdits } = await resolveEditsForFile(file))
    // The doc changed after the read, so the rebuild plan is out of date.
    rebuildPlan = undefined
  }

  // Transformers see the incoming file. Core sets the saved file fields from the output file
  // later, so the saved filename can still change, for example to avoid a name clash. A rebuild
  // plan made before the read stays valid: it already saw the retained original's fields.
  setIncomingFileFields({ doc: pipelineDoc, file })
  pipelineOriginalDoc = createOriginalDoc()

  if (!disableLocalStorage) {
    await fs.mkdir(staticPath!, { recursive: true })
  }

  let newData = incomingFileData as T
  const filesToSave: FileToSave[] = []
  const fileData: Partial<FileData> = {}
  const crop = uploadEdits?.crop
  const isResettingCrop =
    retainedOriginal &&
    crop &&
    isFullCrop(crop) &&
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

  const planStages = async ({ mimeType }: { mimeType: string }) => {
    let plan: Awaited<ReturnType<typeof planUploadPipeline>>

    try {
      plan =
        rebuildPlan?.mimeType === mimeType
          ? rebuildPlan
          : await planUploadPipeline({
              collectionSlug: collectionConfig.slug,
              mimeType,
              pipelineDoc,
              pipelineOriginalDoc,
              req,
            })
    } catch (err) {
      throw toFileUploadError({ err, req })
    }

    assertTransformKeysCovered({ collectionSlug: collectionConfig.slug, pipelineDoc, plan, req })

    return { plan, ...getStagesThatRun({ collectionSlug: collectionConfig.slug, plan }) }
  }

  let {
    bridgeTransformer: plannedBridgeTransformer,
    claimsOfStagesThatRun,
    plan,
    stagesThatRun,
  } = await planStages({ mimeType: file.mimetype })

  // A duplicate is made from the source's main file, which already has the claimed keys
  // applied. The copy drops them so they are not applied twice. A focal point only guides sizes.
  // `resolveUploadEdits` drops `crop` from a duplicate before this, even with no claimer.
  if (isDuplicating && pipelineDoc._transforms) {
    const appliedKeys = [...claimsOfStagesThatRun.values()]
      .flat()
      .filter((key) => !isFocalPointKey(key))
    const keptTransforms = Object.fromEntries(
      Object.entries(pipelineDoc._transforms).filter(([key]) => !appliedKeys.includes(key)),
    )
    pipelineDoc._transforms = Object.keys(keptTransforms).length ? keptTransforms : null
  }

  // A client upload can arrive with only a header probe or no contents (see
  // getFileContentRequirement.ts). Download it only when a stage needs its bytes, which
  // `canTransform` decides here with the real document. The content requirement covers what
  // Sharp's bridge needs for its configuration, but not saved keys that it claims. A focal point
  // only guides sizes, which the content requirement already covers, so it needs no download.
  // Errors from the download and its checks keep their own message and status.
  const plannedBridgeClaims = plannedBridgeTransformer
    ? plan.claims.get(plannedBridgeTransformer)
    : undefined
  const isBridgeApplyingSavedKey = Object.keys(pipelineDoc._transforms ?? {}).some(
    (key) => isClaimRequired(key) && Boolean(plannedBridgeClaims?.includes(key)),
  )

  if (
    !hasFullFileContents(file) &&
    file.uploadReference &&
    (isBridgeApplyingSavedKey ||
      plan.pipeline.some(
        (transformer) => !getUploadTransformerInternal(transformer)?.prepareUpload,
      ))
  ) {
    const download = await downloadClientUpload({
      collection: collectionConfig,
      fetchFullClientUpload,
      file,
      req,
    })
    file = download.file

    // The plan was made for the probe's MIME type. Make it again for the checked type. No stage
    // has run yet, so originalDoc can still be made again.
    if (download.hasTypeChanged) {
      setIncomingFileFields({ doc: pipelineDoc, file })
      pipelineOriginalDoc = createOriginalDoc()
      ;({
        bridgeTransformer: plannedBridgeTransformer,
        claimsOfStagesThatRun,
        plan,
        stagesThatRun,
      } = await planStages({ mimeType: file.mimetype }))
    }
  }

  try {
    // A large client upload can arrive as a bounded probe alongside a temp file. Transformers
    // need the whole file, so leave such an upload untouched rather than buffering it.
    const canRunTransformers = plan.pipeline.length > 0 && hasFullFileContents(file)

    const bridgeTransformer = canRunTransformers ? plannedBridgeTransformer : undefined

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
        let sizeTaskDoc: Readonly<Document> | undefined

        const results = await bridge.prepareUpload!({
          collectionSlug: collectionConfig.slug,
          file: originalWebFile,
          req,
          transform: async (task) => {
            // Size tasks run after the main task, maybe in parallel, so only the main task's
            // changes are kept and the size tasks share a read-only copy of its result.
            const taskDoc =
              task.fieldPath === 'filename'
                ? pipelineDoc
                : (sizeTaskDoc ??= deepFreeze(deepCopyObject(pipelineDoc)))

            const taskFile = await transformUploadFile({
              claims: claimsOfStagesThatRun,
              collectionSlug: collectionConfig.slug,
              doc: taskDoc,
              file: task.file ?? originalWebFile!,
              options: task.options,
              originalDoc: pipelineOriginalDoc,
              originalFile: originalWebFile!,
              pipeline: stagesThatRun,
              req,
            })

            return taskFile
          },
          uploadEdits: editsForTransformer,
        })

        const mainResult = results.find((result) => result.fieldPath === 'filename')

        mainWebFile = mainResult?.file ?? originalWebFile
        fileData.width = mainResult?.width
        fileData.height = mainResult?.height
        hasDimensionsFromBridge = true
        sizeResults = results.filter((result) => result.fieldPath !== 'filename')
      } else {
        const transformedFile = await transformUploadFile({
          claims: claimsOfStagesThatRun,
          collectionSlug: collectionConfig.slug,
          doc: pipelineDoc,
          file: originalWebFile,
          options: undefined,
          originalDoc: pipelineOriginalDoc,
          originalFile: originalWebFile,
          pipeline: plan.pipeline,
          req,
        })

        mainWebFile = transformedFile
      }

      // Planning checked `_transforms` before the stages ran. A stage can add or change a key, so
      // check the final value too, or a key nobody applies would be saved.
      assertTransformKeysCovered({ collectionSlug: collectionConfig.slug, pipelineDoc, plan, req })
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
        transforms: pipelineDoc._transforms,
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
    // Each new cloud version is stored in its own `_objectKey` folder, so the document's own
    // files cannot collide with it and the name can stay the same.
    const ownDocumentID =
      hasManagedCloudStorage && operation === 'update'
        ? (originalDoc as TypeWithID | undefined)?.id
        : undefined
    // Extract prefix if present (added by plugin-cloud-storage)
    const prefix = (data as Record<string, unknown>)?.prefix as string | undefined

    if (hasReusableOriginalMain) {
      fsSafeName = retainedOriginal!.filename
    } else if (
      !overwriteExistingFiles ||
      !disableLocalStorage ||
      (shouldStageCloudFiles && retainedOriginal)
    ) {
      fsSafeName = await getSafeFileName({
        collectionSlug: collectionConfig.slug,
        desiredFilename: fsSafeName,
        excludeDocumentID: ownDocumentID,
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
    // The client already uploaded this object, so it must not be saved again.
    const isProviderObjectMain = Boolean(providerOriginal && !fileWasTransformed)
    if (isProviderObjectMain) {
      fileData._objectKey = providerOriginal!._objectKey
      fileData.prefix = providerOriginal!.prefix
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
          ? await getUnplannedSafeFileName({
              // Without its own storage folder, the original cannot reuse the main file's name.
              canUseName: (name) => Boolean(newObjectKey) || name !== fsSafeName,
              collectionSlug: collectionConfig.slug,
              desiredFilename: getSanitizedUploadFilename(file.name),
              excludeDocumentID: ownDocumentID,
              prefix,
              req,
              staticPath: staticPath!,
            })
          : fsSafeName)
      // A transformed original is a separate object, so it gets its own folder.
      const originalObjectKey = fileWasTransformed && newObjectKey ? randomUUID() : newObjectKey
      const original = retainedOriginal ?? {
        _objectKey: providerOriginal ? providerOriginal._objectKey : originalObjectKey,
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
          role: { type: 'original' },
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
        role: { type: 'default' },
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
    } else if (!hasReusableOriginalMain && !isProviderObjectMain) {
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
          role: { type: 'default' },
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
            role: { type: 'default' },
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
          imageName = await getUnplannedSafeFileName({
            // A size with the same bytes as a planned file can share that file's name.
            canUseName: (name) =>
              Boolean(plannedSizeBuffers.get(name)?.equals(sizeBuffer)) || !plannedNames.has(name),
            collectionSlug: collectionConfig.slug,
            desiredFilename: imageName,
            excludeDocumentID: ownDocumentID,
            prefix,
            req,
            staticPath: disableLocalStorage ? undefined : staticPath!,
          })
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
            role: { type: 'size', sizeKey: sizeName },
          })
        }
      }

      fileData.variants = sizes
    }
  } catch (err) {
    throw toFileUploadError({ err, req })
  }

  newData = {
    ...newData,
    ...fileData,
    ...(draft ? { _status: 'draft' } : {}),
  }

  return {
    data: newData,
    files: filesToSave,
    transforms: pipelineDoc._transforms,
  }
}

/** Finds a name that is free in storage and that `canUseName` accepts for this save. */
async function getUnplannedSafeFileName({
  canUseName,
  desiredFilename,
  ...args
}: {
  canUseName: (filename: string) => boolean
} & Parameters<typeof getSafeFileName>[0]): Promise<string> {
  let filename = desiredFilename

  while (true) {
    filename = await getSafeFileName({ ...args, desiredFilename: filename })
    if (canUseName(filename)) {
      return filename
    }
    filename = incrementName(filename)
  }
}

/** Checks the file, and uses the detected MIME type when the file is a processable image. */
const checkFileAndUseDetectedType = async ({
  collection,
  file,
  req,
}: {
  collection: SanitizedCollectionConfig
  file: NonNullable<PayloadRequest['file']>
  req: PayloadRequest
}): Promise<NonNullable<PayloadRequest['file']>> => {
  const detectedFileType = await checkFileRestrictions({ collection, file, req })

  const shouldUseDetectedFileType =
    detectedFileType &&
    (isProcessableImage(file.mimetype) || isProcessableImage(detectedFileType.mime))

  if (shouldUseDetectedFileType && detectedFileType.mime !== file.mimetype) {
    return { ...file, mimetype: detectedFileType.mime }
  }

  return file
}

/**
 * Downloads the whole client upload and checks it again, because the first check saw only a
 * probe. Sets `req.file` to the result, so hooks, storage plugins and temp file cleanup see it.
 */
async function downloadClientUpload({
  collection,
  fetchFullClientUpload,
  file: probedFile,
  req,
}: {
  collection: SanitizedCollectionConfig
  fetchFullClientUpload: typeof downloadFullClientUpload
  file: NonNullable<PayloadRequest['file']>
  req: PayloadRequest
}): Promise<{ file: NonNullable<PayloadRequest['file']>; hasTypeChanged: boolean }> {
  const downloadedFile = await fetchFullClientUpload({
    collectionSlug: collection.slug,
    file: probedFile,
    req,
  })
  // On req.file, the temp file is removed after the operation, also when the check fails.
  req.file = downloadedFile
  const checkedFile = await checkFileAndUseDetectedType({ collection, file: downloadedFile, req })
  // Later steps change this same object, for example to drop its upload reference.
  req.file = checkedFile

  return { file: checkedFile, hasTypeChanged: checkedFile.mimetype !== probedFile.mimetype }
}

const hasUploadTransformers = ({ req }: { req: PayloadRequest }): boolean =>
  Boolean(req.payload.config.upload?.transformers?.length)

/** Puts the incoming file's name, size and MIME type into the transformer `doc`. */
function setIncomingFileFields({
  doc,
  file,
}: {
  doc: Document
  file: NonNullable<PayloadRequest['file']>
}): Document {
  doc.filename = file.name
  doc.filesize = file.size
  doc.mimeType = file.mimetype

  return doc
}

/**
 * Maps an error from transformer planning or the pipeline. A validation error and a broken
 * transformer contract keep their own message; anything else is logged and becomes a
 * `FileUploadError`.
 */
function toFileUploadError({ err, req }: { err: unknown; req: PayloadRequest }): Error {
  if (err instanceof ValidationError) {
    return err
  }

  req.payload.logger.error(err)

  return err instanceof TransformerContractError ? err : new FileUploadError(req.t)
}
