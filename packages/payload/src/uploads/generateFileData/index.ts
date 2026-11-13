import fs from 'fs/promises'

import type { Collection, TypeWithID } from '../../collections/config/types.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { Document, PayloadRequest } from '../../types/index.js'
import type { ExternalUploadSource } from '../sanitizeUploadData.js'
import type { FileData, FileToSave } from '../types.js'

import { MissingFile } from '../../errors/index.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { deepFreeze } from '../../utilities/deepFreeze.js'
import { fetchFullClientUpload as downloadFullClientUpload } from '../getFileFromUploadInstructions.js'
import { hasFullFileContents } from '../hasFullFileContents.js'
import { getRequestTimeDefaultFileData } from '../requestTimeFileData.js'
import { getChangedTransformKeys } from '../transformState/getChangedTransformKeys.js'
import {
  assertDeclaredTransformsValid,
  hasTransformValidators,
} from './edits/assertDeclaredTransformsValid.js'
import { getCropResetAndFocalPointChange, withSavedEdits } from './edits/legacyUploadEdits.js'
import { resolveUploadEdits } from './edits/resolveUploadEdits.js'
import { buildUploadOutput } from './output/buildUploadOutput.js'
import { planSourceRebuild } from './plan/planSourceRebuild.js'
import { planUploadStages, withoutAppliedKeys } from './plan/planUploadStages.js'
import { runUploadTransformers } from './runUploadTransformers.js'
import { downloadClientUpload, needsFullClientUpload } from './source/downloadClientUpload.js'
import { readUploadSource } from './source/readUploadSource.js'
import { getStoredOriginal, selectUploadSource } from './source/selectUploadSource.js'
import { checkFileAndUseDetectedType } from './utils/checkFileAndUseDetectedType.js'
import { getUploadStorage } from './utils/getUploadStorage.js'
import { toFileUploadError } from './utils/toFileUploadError.js'

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

type ResolvedEdits = Awaited<ReturnType<typeof resolveUploadEdits>>

/**
 * Builds the document's file metadata and the list of files to write to disk.
 *
 * ```
 * resolve edits → select the source → decide whether processing is needed
 *   → read the source and plan the stages → run the transformers → build and assemble the result
 * ```
 *
 * A source is read only when the operation needs its bytes. A request-time file and an unchanged
 * upload often need none. A large client upload may arrive as a temp file instead of an in-memory
 * buffer (see getFileFromUploadInstructions.ts), and `file.data` can hold only a partial probe
 * rather than the full file. To avoid loading such files into memory unnecessarily, no
 * transformer runs unless the full bytes are available, a temp file is not read when local
 * storage is disabled, and it is copied straight to its destination when local storage is enabled.
 */
export const generateFileData = async <T>(args: Args<T>): Result<T> => {
  const {
    collection: { config: collection },
    data,
    draft,
    externalUploadSource,
    fetchFullClientUpload = downloadFullClientUpload,
    isDuplicating,
    operation,
    originalDoc,
    req,
    throwOnMissingFile,
  } = args

  if (!collection.upload) {
    return { data, files: [] }
  }

  const hasTransformers = hasUploadTransformers({ req })
  const incomingFileData: Document = isDuplicating ? originalDoc : data
  const currentFileData = (operation === 'update' ? originalDoc : incomingFileData) as
    | FileData
    | undefined
  const documentID =
    operation === 'update' ? (originalDoc as TypeWithID | undefined)?.id : undefined
  const newFile = isDuplicating ? undefined : req.file
  const storage = getUploadStorage({ collection, file: newFile, req })
  const draftStatus = draft ? { _status: 'draft' } : {}
  // Only transformers read originalDoc, so it is copied only when there are some.
  const createOriginalDoc = ({ doc }: { doc: Document }): Readonly<Document> =>
    hasTransformers ? deepFreeze(deepCopyObject(doc)) : doc

  // 1. Resolve the edits: the `_transforms` to save, and the edits that the pipeline applies.
  const editArgs = {
    collectionSlug: collection.slug,
    data,
    focalPointEnabled: collection.upload.focalPoint !== false,
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
  let uploadEdits = edits.uploadEdits
  let pipelineDoc = createPipelineDoc({ doc: docToSave, edits, hasTransformers })
  // `validate` gets the document as it was before the stages, frozen, as transformers get it.
  const pipelineSnapshot = hasTransformValidators({ req })
    ? deepFreeze(deepCopyObject(pipelineDoc))
    : undefined

  // A supplied `_transforms` replaces the stored value, so each declared key in it is checked,
  // changed or not. An update without `_transforms` keeps the stored value and checks nothing.
  if (pipelineSnapshot && (data as Document | undefined)?._transforms !== undefined) {
    await assertDeclaredTransformsValid({
      collectionSlug: collection.slug,
      doc: pipelineDoc,
      originalDoc: pipelineSnapshot,
      req,
    })
  }

  // Reads `edits` and `pipelineDoc` when it is called: both can change after a file is read.
  const assemble = async ({ data: fileData, files }: { data: Document; files: FileToSave[] }) => {
    // A stage can change a declared key, so that key is checked again on the final value. Files
    // are written later in the operation, so this still runs before any storage work.
    const keysChangedByStages = pipelineSnapshot
      ? getChangedTransformKeys({
          next: pipelineDoc._transforms,
          previous: pipelineSnapshot._transforms,
        })
      : []

    if (pipelineSnapshot && keysChangedByStages.length > 0) {
      await assertDeclaredTransformsValid({
        collectionSlug: collection.slug,
        doc: pipelineDoc,
        keys: keysChangedByStages,
        originalDoc: pipelineSnapshot,
        req,
      })
    }

    return assembleResult<T>({
      data: fileData,
      editArgs,
      edits,
      files,
      transforms: pipelineDoc._transforms,
    })
  }

  // 2. Select the source and decide whether it is processed. Nothing is read yet.
  const source = selectUploadSource({
    currentFileData,
    externalUploadSource,
    isDuplicating,
    newFile,
    operation,
  })
  const retainedOriginal = source.type === 'retainedOriginal' ? source.original : undefined
  const storedOriginal = getStoredOriginal({ source })
  const storedMimeType = retainedOriginal?.mimeType ?? currentFileData?.mimeType

  // A rebuild reads the stored original, so planning sees its size and type, as the stages
  // will after the read. The name stays the main file's, as for the file that is read.
  if (storedOriginal) {
    pipelineDoc.filesize = storedOriginal.filesize
    pipelineDoc.mimeType = storedOriginal.mimeType
  }

  let pipelineOriginalDoc = createOriginalDoc({ doc: pipelineDoc })
  const rebuild = await planSourceRebuild({
    canStoreOriginal: storage.canStoreOriginal,
    collectionSlug: collection.slug,
    documentID,
    incomingFileData,
    isDuplicating,
    pipelineDoc,
    pipelineOriginalDoc,
    previousTransforms:
      operation === 'update'
        ? ((originalDoc as Document | undefined)?._transforms ?? null)
        : undefined,
    req,
    source,
    storedMimeType,
    uploadEdits,
  })

  // The retained original stays, and request-time stages build the default file from it. Only an
  // update keeps an original, so `retainedOriginal` is always set here; the check narrows its type.
  if (rebuild.outcome === 'applyAtRequest' && retainedOriginal) {
    return assemble({
      data: {
        ...incomingFileData,
        ...getRequestTimeDefaultFileData({
          original: retainedOriginal,
          transforms: pipelineDoc._transforms,
        }),
        ...draftStatus,
      },
      files: [],
    })
  }

  // 3. Read the source when it is processed, and plan the stages for the file.
  let file = newFile
  let shouldOverwriteExistingFiles = Boolean(args.overwriteExistingFiles)

  if (rebuild.shouldReadSource && source.type !== 'newUpload' && source.type !== 'none') {
    if (storedOriginal) {
      uploadEdits = withSavedEdits({
        edits: uploadEdits,
        original: storedOriginal,
        transforms: pipelineDoc._transforms,
      })
    }

    const read = await readUploadSource({
      collection,
      currentFilename: currentFileData?.filename,
      originalDoc,
      req,
      source,
      storedMimeType,
    })

    file = read.file
    shouldOverwriteExistingFiles = read.shouldOverwriteExistingFiles ?? shouldOverwriteExistingFiles
  }

  if (isDuplicating) {
    shouldOverwriteExistingFiles = false
  }

  if (!file) {
    if (throwOnMissingFile) {
      throw new MissingFile(req.t)
    }

    return assemble({ data: incomingFileData, files: [] })
  }

  file = await checkFileAndUseDetectedType({ collection, file, req })
  let earlierPlan = rebuild.earlierPlan

  if (edits.isWaitingForFile) {
    // The file was read, so a saved crop can now be checked. The transformer `doc` holds the
    // resolved `_transforms`, so it is built again too, and the rebuild plan is out of date.
    edits = await resolveUploadEdits({ ...editArgs, file })
    uploadEdits = edits.uploadEdits
    pipelineDoc = createPipelineDoc({ doc: docToSave, edits, hasTransformers })
    earlierPlan = undefined
  }

  // Transformers see the incoming file. Core sets the saved file fields from the output file
  // later, so the saved filename can still change, for example to avoid a name clash. A rebuild
  // plan made before the read stays valid: it already saw the retained original's fields.
  setIncomingFileFields({ doc: pipelineDoc, file })
  pipelineOriginalDoc = createOriginalDoc({ doc: pipelineDoc })

  if (!collection.upload.disableLocalStorage) {
    await fs.mkdir(collection.upload.staticDir!, { recursive: true })
  }

  const { cropSize, hasFocalPointChange, isResettingCrop } = getCropResetAndFocalPointChange({
    currentFileData,
    retainedOriginal,
    uploadEdits,
  })
  // The stages are planned again below when a download changes the MIME type.
  const stagePlanArgs = {
    // Request-time stages start from the stored original, so one must be stored.
    canApplyAtRequest: storage.canStoreOriginal,
    collectionSlug: collection.slug,
    documentID,
    earlierPlan,
    pipelineDoc,
    req,
  }
  let stages = await planUploadStages({
    ...stagePlanArgs,
    mimeType: file.mimetype,
    pipelineOriginalDoc,
  })

  // `resolveUploadEdits` drops `crop` from a duplicate before this, even with no claimer. A copy
  // made from the source's original keeps every key.
  if (isDuplicating && source.type !== 'duplicatedOriginal' && pipelineDoc._transforms) {
    pipelineDoc._transforms = withoutAppliedKeys({ stages, transforms: pipelineDoc._transforms })
    // No stage has run yet, so originalDoc is made again without the dropped keys.
    pipelineOriginalDoc = createOriginalDoc({ doc: pipelineDoc })
  }

  // A client upload can arrive with only a header probe or no contents. Download it only when a
  // stage needs its bytes, which `canTransform` decides here with the real document.
  if (needsFullClientUpload({ file, pipelineDoc, stages })) {
    const download = await downloadClientUpload({ collection, fetchFullClientUpload, file, req })
    file = download.file

    // The plan was made for the probe's MIME type. Make it again for the checked type. No stage
    // has run yet, so originalDoc can still be made again.
    if (download.hasTypeChanged) {
      setIncomingFileFields({ doc: pipelineDoc, file })
      pipelineOriginalDoc = createOriginalDoc({ doc: pipelineDoc })
      stages = await planUploadStages({
        ...stagePlanArgs,
        mimeType: file.mimetype,
        pipelineOriginalDoc,
      })
    }
  }

  // 4. Run the transformers, and build the file fields and the files to store.
  let output: Awaited<ReturnType<typeof buildUploadOutput>>

  try {
    // A large client upload can arrive as a bounded probe alongside a temp file. Transformers
    // need the whole file, so leave such an upload untouched rather than buffering it.
    const transformed =
      stages.pipeline.length > 0 && hasFullFileContents(file)
        ? await runUploadTransformers({
            collectionSlug: collection.slug,
            cropSize,
            file,
            pipelineDoc,
            pipelineOriginalDoc,
            req,
            stages,
          })
        : undefined

    output = await buildUploadOutput({
      collection,
      currentFileData,
      documentID,
      file,
      focalPoint: { hasChange: hasFocalPointChange, value: uploadEdits?.focalPoint },
      isAppliedAtRequest: stages.isAppliedAtRequest,
      isResettingCrop,
      pipelineDoc,
      pipelineOriginalDoc,
      // Extract prefix if present (added by plugin-cloud-storage)
      prefix: (data as Record<string, unknown>)?.prefix as string | undefined,
      req,
      retainedOriginal,
      shouldOverwriteExistingFiles,
      storage,
      transformed,
    })
  } catch (err) {
    throw toFileUploadError({ err, req })
  }

  // 5. Assemble the result.
  return assemble({
    data: { ...incomingFileData, ...output.fileData, ...draftStatus },
    files: output.files,
  })
}

/**
 * The saved data with the final `_transforms`. A stage can change the focal point, so focalX and
 * focalY follow the final value, rounded as `resolveUploadEdits` rounds them.
 */
async function assembleResult<T>({
  data,
  editArgs,
  edits,
  files,
  transforms,
}: {
  data: Document
  editArgs: Parameters<typeof resolveUploadEdits>[0]
  edits: ResolvedEdits
  files: FileToSave[]
  /** The final `_transforms` of the transformer `doc`, after every stage ran. */
  transforms: Document['_transforms']
}): Result<T> {
  // No file was read, so the crop cannot be checked. This throws its validation error.
  const finalEdits = edits.isWaitingForFile ? await resolveUploadEdits(editArgs) : edits
  const finalFocalPoint = (transforms as { focalPoint?: { x: number; y: number } } | null)
    ?.focalPoint
  const focalFields =
    editArgs.focalPointEnabled && finalFocalPoint
      ? { focalX: Math.round(finalFocalPoint.x), focalY: Math.round(finalFocalPoint.y) }
      : {}

  return {
    data: {
      ...finalEdits.applyTransformState(data),
      ...focalFields,
      _transforms: transforms ?? null,
    } as T,
    files,
  }
}

/** The transformer `doc`: the document as the operation would save it, with the resolved edits. */
function createPipelineDoc({
  doc,
  edits,
  hasTransformers,
}: {
  doc: unknown
  edits: ResolvedEdits
  hasTransformers: boolean
}): Document {
  const pipelineDoc = edits.applyTransformState(doc as Document)

  // Without transformers nothing reads or changes the doc, so a shallow copy is enough.
  return hasTransformers ? deepCopyObject(pipelineDoc) : { ...pipelineDoc }
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
