import type { Document, PayloadRequest } from '../../../types/index.js'
import type { TransformState } from '../../transformState/transformStateInput.js'
import type { UploadEdits } from '../../types.js'

import { isRequestTimeFile } from '../../isRequestTimeFile.js'
import {
  assertValidTransformState,
  getNextTransformState,
  getOriginalDimensions,
  readSubmittedTransformState,
  toSavedTransformState,
} from '../../transformState/transformStateInput.js'
import {
  applyLegacyEdits,
  getCurrentFocalPoint,
  getFocalPointWrite,
  getNextFocalPoint,
  parseLegacyUploadEdits,
  toPipelineEdits,
} from './legacyUploadEdits.js'

/**
 * Combines `_transforms`, the `uploadEdits` query and `focalX`/`focalY` into the `_transforms`
 * value to save and the edits that the upload pipeline applies to the original. The general
 * `_transforms` rules are in transformState/transformStateInput.ts, and the older inputs in
 * legacyUploadEdits.ts.
 */
export async function resolveUploadEdits({
  canWaitForFile,
  collectionSlug,
  data,
  file: fileArg,
  focalPointEnabled,
  isDuplicating,
  operation,
  originalDoc,
  req,
}: {
  /**
   * True when the file is read later in the operation, as on a create from a URL. A saved crop
   * that needs the file's size then returns `isWaitingForFile`, and the caller resolves again
   * with the read `file` before any transformer runs.
   */
  canWaitForFile?: boolean
  collectionSlug: string
  data: unknown
  /** The new file. Defaults to `req.file`. */
  file?: PayloadRequest['file']
  focalPointEnabled: boolean
  isDuplicating?: boolean
  operation: 'create' | 'update'
  originalDoc: unknown
  req: PayloadRequest
}): Promise<{
  applyTransformState: <T>(fileData: T) => T
  isWaitingForFile?: boolean
  uploadEdits: UploadEdits
}> {
  const parsedEdits = parseLegacyUploadEdits({
    data,
    isDuplicating,
    operation,
    // Only a duplication source informs edit parsing. Updates now also pass `originalDoc` so the
    // stored file can be reprocessed, and that must not change which edits are applied.
    originalDoc: isDuplicating ? originalDoc : undefined,
    req,
  })

  if (isDuplicating) {
    return {
      applyTransformState: getDuplicateTransformState({ source: originalDoc as Document }),
      uploadEdits: parsedEdits,
    }
  }

  const incoming = (data ?? {}) as Document
  const current = (operation === 'update' ? originalDoc : undefined) as Document
  const file = fileArg ?? req.file
  const hasNewFile = Boolean(file)
  const queryEdits = req.query?.uploadEdits as undefined | UploadEdits
  // Crop coordinates belong to the replaced file, so a new file starts without them.
  const previous: TransformState = hasNewFile ? null : (current?._transforms ?? null)
  const submitted = readSubmittedTransformState({ collectionSlug, incoming, req })
  const hasCrop = Boolean(submitted?.crop || queryEdits?.crop || previous?.crop)
  const original = hasCrop ? await getOriginalDimensions({ current, file }) : undefined

  if ((submitted?.crop || queryEdits?.crop) && !original && canWaitForFile) {
    return {
      applyTransformState: (fileData) => fileData,
      isWaitingForFile: true,
      uploadEdits: parsedEdits,
    }
  }

  if (submitted !== undefined) {
    assertValidTransformState({ collectionSlug, original, req, submitted })
  }

  const currentFocalPoint = getCurrentFocalPoint({ current, previous })
  const next = toSavedTransformState({
    state: applyLegacyEdits({
      adminCrop: queryEdits?.crop,
      currentFocalPoint,
      focalPointWrite: getFocalPointWrite({
        current,
        currentFocalPoint,
        incoming,
        queryFocalPoint: queryEdits?.focalPoint,
      }),
      isLegacyDocument: !previous && !hasNewFile && operation === 'update',
      original,
      state: getNextTransformState({ previous, submitted }),
      submitted,
    }),
  })
  const nextFocalPoint = getNextFocalPoint({
    currentFocalPoint,
    hasNewFile,
    next,
    previous,
    submitted,
  })

  const uploadEdits = toPipelineEdits({
    hasFocalPointChange: nextFocalPoint.hasChange,
    hasNewFile,
    next,
    nextFocalPoint: nextFocalPoint.rounded,
    original,
    parsedEdits,
    previous,
  })

  const applyTransformState = <T>(fileData: T): T => ({
    ...fileData,
    ...(focalPointEnabled && (next?.focalPoint || nextFocalPoint.hasChange)
      ? { focalX: nextFocalPoint.rounded.x, focalY: nextFocalPoint.rounded.y }
      : {}),
    _transforms: next,
  })

  return { applyTransformState, uploadEdits }
}

/**
 * A duplicate is made from the source's cropped main file, which becomes the copy's original.
 * The crop is already part of those files, so the copy keeps every other key but not `crop`.
 * generateFileData then also drops the other keys that a stage claims. A source with no stored
 * main file is copied from its original, so its copy keeps every key.
 */
function getDuplicateTransformState({ source }: { source: Document }): <T>(fileData: T) => T {
  if (isRequestTimeFile({ entry: source })) {
    return (fileData) => fileData
  }

  return <T>(fileData: T): T => {
    const { crop: _crop, ...rest } = ((fileData as Document)._transforms ?? {}) as Document

    return { ...fileData, _transforms: Object.keys(rest).length ? rest : null }
  }
}
