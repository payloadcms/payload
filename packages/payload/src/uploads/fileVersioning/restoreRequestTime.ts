import { rm, stat } from 'node:fs/promises'

import type { TypeWithID } from '../../collections/config/types.js'
import type { Document, JsonObject } from '../../types/index.js'
import type { OriginalFileData } from '../types.js'
import type { FileRestoreArgs } from './restore.js'

import { APIError } from '../../errors/APIError.js'
import { ValidationError } from '../../errors/ValidationError.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { deepFreeze } from '../../utilities/deepFreeze.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { generateFileData } from '../generateFileData.js'
import { generateFilePathOrURL } from '../generateFilePathOrURL.js'
import { streamResponseToTempFile } from '../getFileFromUploadInstructions.js'
import { shouldRequestOriginal } from '../isOriginalFileRequest.js'
import { isRequestTimeFile } from '../isRequestTimeFile.js'
import { getRequestTimeDefaultFileData, getRequestTimeVariants } from '../requestTimeFileData.js'
import {
  canBuildAtRequest,
  getStagesThatRun,
  planUploadPipeline,
  resolveTransformKeyCoverage,
} from '../transformState/planUpload.js'
import { getTransformStateError } from '../transformState/validateTransformState.js'
import { runLocalFileUpdate } from './archive.js'
import { runCloudFileUpdate } from './cloudStorage.js'
import { shareFileOperationScope } from './fileOperationManager.js'
import { collectStoredFiles } from './storedFiles.js'

/** Restore recipes from their retained source, never from a virtual filename or current document. */
export async function runRequestTimeFileRestore<T>({
  id,
  collection,
  copyStoredFiles,
  current,
  req,
  selected,
  write,
}: {
  copyStoredFiles: (args: FileRestoreArgs<T>) => Promise<T>
} & FileRestoreArgs<T>): Promise<T> {
  const original = selected.original as OriginalFileData | undefined
  const originalFile = collectStoredFiles({ collection, doc: selected, req }).find(({ roles }) =>
    roles.some(({ type }) => type === 'original'),
  )

  if (!original?.filename || !original.mimeType || !originalFile) {
    throw new APIError('Restoring request-time files requires a retained original.', 400)
  }

  // A restore always uses the saved recipe. Caller upload data and query edits cannot override it.
  const replayReq = isolateObjectProperty(req, ['file', 'query', 'searchParams', 'context'])
  replayReq.file = undefined
  replayReq.query = {}
  Object.assign(replayReq, { searchParams: new URLSearchParams() })
  replayReq.context = { ...req.context }
  shareFileOperationScope({ owner: req, req: replayReq })

  const pipelineDoc = deepCopyObject({
    ...selected,
    filename: original.filename,
    filesize: original.filesize,
    mimeType: original.mimeType,
    variants: {},
  }) as Document
  const pipelineOriginalDoc = deepFreeze(deepCopyObject(pipelineDoc))
  const transformError = await getTransformStateError({
    original,
    value: pipelineDoc._transforms,
  })

  if (transformError) {
    throw new ValidationError(
      {
        collection: collection.slug,
        errors: [{ message: transformError, path: '_transforms' }],
        req,
      },
      req.t,
    )
  }

  const planArgs = {
    collectionSlug: collection.slug,
    documentID: id,
    mimeType: original.mimeType,
    pipelineDoc,
    pipelineOriginalDoc,
    req: replayReq,
  }
  const plan = await planUploadPipeline(planArgs)
  const { isAppliedAtRequest } = await resolveTransformKeyCoverage({
    ...planArgs,
    canApplyAtRequest: true,
    plan,
  })
  const { bridgeTransformer, stagesThatRun } = getStagesThatRun({
    collectionSlug: collection.slug,
    plan,
  })
  const shouldRunUpload = !isAppliedAtRequest && stagesThatRun.length > 0
  const hasVariants = Boolean(collection.upload.variants?.length)
  const hasRequestTimeVariants =
    hasVariants &&
    (!shouldRunUpload || bridgeTransformer?.slug !== collection.upload.variantsTransformerSlug)

  if (
    hasRequestTimeVariants &&
    (!collection.upload.variantsTransformerSlug ||
      !(await canBuildAtRequest({
        ...planArgs,
        requiredTransformerSlug: collection.upload.variantsTransformerSlug,
      })))
  ) {
    throw new APIError('No compatible transformer can restore the configured file variants.', 400)
  }

  const normalizeURLs = ({ restored }: { restored: JsonObject }): JsonObject => {
    const original = restored.original as JsonObject
    const entries = [
      { entry: restored, isOriginal: false },
      { entry: original, isOriginal: shouldRequestOriginal({ doc: restored }) },
      ...Object.values(restored.variants ?? {}).map((entry) => ({
        entry: entry as JsonObject,
        isOriginal: false,
      })),
    ]
    for (const { entry, isOriginal } of entries) {
      if (entry && (!collection.upload.fileOperations || isRequestTimeFile({ entry }))) {
        entry.url = generateFilePathOrURL({
          collectionSlug: collection.slug,
          config: req.payload.config,
          filename: entry.filename,
          isOriginal,
          relative: true,
          urlOrPath: undefined,
        })
      }
    }
    return restored
  }

  const clearRemovedVariants = ({ restored }: { restored: JsonObject }): JsonObject => {
    const variants = { ...restored.variants }
    for (const name of new Set([
      ...Object.keys(current.variants ?? {}),
      ...Object.keys(selected.variants ?? {}),
    ])) {
      variants[name] ??= {
        _objectKey: null,
        _stored: null,
        filename: null,
        filesize: null,
        height: null,
        mimeType: null,
        prefix: null,
        url: null,
        width: null,
      }
    }
    return { ...restored, variants }
  }

  if (!shouldRunUpload) {
    // Copy the retained source using storage operations. Virtual restores never download bytes.
    return copyStoredFiles({
      id,
      collection,
      current,
      req: replayReq,
      selected: { ...selected, _stored: false, variants: {} },
      write: async (copied) => {
        const copiedOriginal = copied.original as OriginalFileData
        const restored = {
          ...copied,
          original: { ...copiedOriginal },
          ...(isAppliedAtRequest
            ? getRequestTimeDefaultFileData({
                original: copiedOriginal,
                transforms: pipelineDoc._transforms,
              })
            : { ...copiedOriginal, _stored: null, url: null }),
          variants: hasRequestTimeVariants
            ? await getRequestTimeVariants({
                collection,
                documentID: id,
                filename: copiedOriginal.filename,
                original: copiedOriginal,
                prefix: copiedOriginal.prefix,
                req: replayReq,
                staticPath: collection.upload.disableLocalStorage
                  ? undefined
                  : collection.upload.staticDir,
              })
            : {},
        }
        return write(normalizeURLs({ restored: clearRemovedVariants({ restored }) }))
      },
    })
  }

  const response = await retrieveFileResponse({
    collection: { config: collection },
    doc: selected as TypeWithID,
    filename: original.filename,
    isOriginal: true,
    operation: 'transform',
    req: replayReq,
  })
  if (!response.ok) {
    throw new APIError('Unable to read the retained original for restore.', 400)
  }
  // Stream the retained original to a temp file, so core never holds the whole source in memory.
  const tempFilePath = await streamResponseToTempFile({ req: replayReq, response })

  try {
    replayReq.file = {
      name: original.filename,
      data: Buffer.alloc(0),
      mimetype: original.mimeType,
      size: (await stat(tempFilePath)).size,
      tempFilePath,
    }
    const { data, files } = await generateFileData<JsonObject>({
      collection: { config: collection },
      config: req.payload.config,
      data: pipelineDoc,
      operation: 'create',
      overwriteExistingFiles: false,
      req: replayReq,
    })
    const finalTransformError = await getTransformStateError({ original, value: data._transforms })
    if (finalTransformError) {
      throw new ValidationError(
        {
          collection: collection.slug,
          errors: [{ message: finalTransformError, path: '_transforms' }],
          req,
        },
        req.t,
      )
    }

    // The retained original is immutable. Reuse it instead of storing another copy or archiving
    // its selected historical reference when only the generated outputs change.
    data.original = { ...original }
    const outputFiles = files.filter(({ role }) => role?.type !== 'original')
    const restored = normalizeURLs({ restored: clearRemovedVariants({ restored: data }) })
    const writeRestored = () => {
      if (collection.upload.fileOperations) {
        // Keep the existing adapter metadata hook active through the outer restore's afterChange.
        req.context._payloadManagedCloudStorage = true
        req.context._payloadManagedCloudMetadata = replayReq.context._payloadManagedCloudMetadata
      }
      return write(restored)
    }

    return await (collection.upload.fileOperations
      ? runCloudFileUpdate({
          id,
          collection,
          current,
          data: restored,
          files: outputFiles,
          req: replayReq,
          write: writeRestored,
        })
      : runLocalFileUpdate({
          id,
          collection,
          current,
          files: outputFiles,
          next: restored,
          req: replayReq,
          write: writeRestored,
        }))
  } finally {
    await rm(tempFilePath, { force: true })
  }
}
