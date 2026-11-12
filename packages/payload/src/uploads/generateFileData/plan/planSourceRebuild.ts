import type { Document, PayloadRequest } from '../../../types/index.js'
import type { UploadPlan, UploadRebuildOutcome } from '../../transformState/planUpload.js'
import type { UploadEdits } from '../../types.js'
import type { UploadSource } from '../source/selectUploadSource.js'

import { hasCropOrResizeEdit } from '../../hasCropOrResizeEdit.js'
import { planUploadRebuild } from '../../transformState/planUpload.js'
import { hasLegacyCropOrFocalPointEdit } from '../edits/legacyUploadEdits.js'
import { toFileUploadError } from '../utils/toFileUploadError.js'

/**
 * Decides what an operation without a new file does with its source: keep the stored files, read
 * the source and rebuild them, or let request-time stages apply the saved keys. Decided before any
 * bytes are read. A new upload is always processed, so it keeps nothing.
 */
export async function planSourceRebuild({
  canStoreOriginal,
  collectionSlug,
  documentID,
  incomingFileData,
  isDuplicating,
  pipelineDoc,
  pipelineOriginalDoc,
  previousTransforms,
  req,
  source,
  storedMimeType,
  uploadEdits,
}: {
  canStoreOriginal: boolean
  collectionSlug: string
  documentID?: number | string
  /** The data that the operation saves the file fields onto. */
  incomingFileData: Document
  isDuplicating?: boolean
  pipelineDoc: Document
  pipelineOriginalDoc: Readonly<Document>
  /** The stored `_transforms` on an update; `undefined` when there is nothing to compare. */
  previousTransforms: Document['_transforms']
  req: PayloadRequest
  source: UploadSource
  storedMimeType?: string
  uploadEdits: UploadEdits
}): Promise<{
  /** The rebuild plan, for the stages to reuse once the source is read. */
  earlierPlan?: { isAppliedAtRequest: boolean; plan: UploadPlan }
  outcome: UploadRebuildOutcome
  /** The source's bytes are needed: to rebuild the files, or to store a copy's own original. */
  shouldReadSource: boolean
}> {
  if (source.type === 'newUpload' || source.type === 'none') {
    return { outcome: 'keep', shouldReadSource: false }
  }

  const { outcome, rebuildPlan } = await planUploadRebuild({
    // A rebuild keeps the stored original. A duplicate gets its own copy, which is written only
    // where an original can be stored.
    canApplyAtRequest:
      source.type === 'retainedOriginal' ||
      (source.type === 'duplicatedOriginal' && canStoreOriginal),
    collectionSlug,
    documentID,
    // Not `uploadEdits`: a focal point change copies the saved crop into it, so the crop is
    // applied again if the file is rebuilt. That copy is not a crop edit.
    hasCropOrFocalPointEdit: hasLegacyCropOrFocalPointEdit({
      fileData: incomingFileData,
      uploadEdits,
    }),
    hasCropOrResizeEdit: hasCropOrResizeEdit(req.query?.uploadEdits as undefined | UploadEdits),
    isDuplicating: Boolean(isDuplicating),
    isExternalSource: source.type === 'externalURL',
    pipelineDoc,
    pipelineOriginalDoc,
    previousTransforms,
    req,
    storedMimeType,
  }).catch((err: unknown) => {
    throw toFileUploadError({ err, req })
  })

  const isAppliedAtRequest = outcome === 'applyAtRequest' || outcome === 'copyForRequest'

  return {
    earlierPlan: rebuildPlan ? { isAppliedAtRequest, plan: rebuildPlan } : undefined,
    outcome,
    // A copy for request-time stages reads the source's original only to store its own copy.
    shouldReadSource: outcome === 'rebuild' || outcome === 'copyForRequest',
  }
}
