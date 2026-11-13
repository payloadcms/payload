/**
 * Compatibility with the inputs that predate `_transforms`: the `uploadEdits` query (the admin
 * crop and focal point editor), `focalX`/`focalY`, and the `UploadEdits` that core still reads to
 * decide on rebuilds, crop resets and the crop size for the upload bridge. The general
 * `_transforms` rules are in transformState/transformStateInput.ts.
 */
import { isDeepStrictEqual } from 'node:util'

import type { Document, PayloadRequest } from '../../../types/index.js'
import type { Dimensions, TransformState } from '../../transformState/transformStateInput.js'
import type { FileData, FocalPoint, OriginalFileData, UploadEdits } from '../../types.js'

import { isNumber } from '../../../utilities/isNumber.js'
import { hasCropOrResizeEdit } from '../../hasCropOrResizeEdit.js'
import { cropToPercent, cropToPixels, isFullCrop } from '../../transformState/cropUnits.js'

export const centerFocalPoint: FocalPoint = { x: 50, y: 50 }
const fullCrop = { height: 100, unit: '%', width: 100, x: 0, y: 0 } as const

/** The edits sent through the `uploadEdits` query, or a focal point sent through `focalX`/`focalY`. */
export function parseLegacyUploadEdits({
  data,
  isDuplicating,
  operation,
  originalDoc,
  req,
}: {
  data: unknown
  isDuplicating?: boolean
  operation: 'create' | 'update'
  /** Only a duplication source informs edit parsing. */
  originalDoc: unknown
  req: PayloadRequest
}): UploadEdits {
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

/** The stored focal point: the saved `_transforms` one, else `focalX`/`focalY`, else the center. */
export function getCurrentFocalPoint({
  current,
  previous,
}: {
  current?: Document
  previous: TransformState
}): FocalPoint {
  return (
    previous?.focalPoint ??
    (isNumber(current?.focalX) && isNumber(current?.focalY)
      ? { x: current.focalX, y: current.focalY }
      : centerFocalPoint)
  )
}

/**
 * The focal point written through the query or through `focalX`/`focalY`. Each of `focalX` and
 * `focalY` can be sent alone. The admin sends back the stored, rounded values on every save, so a
 * value equal to the stored one is not a write and the exact saved value is kept.
 */
export function getFocalPointWrite({
  current,
  currentFocalPoint,
  incoming,
  queryFocalPoint,
}: {
  current?: Document
  currentFocalPoint: FocalPoint
  incoming: Document
  queryFocalPoint?: FocalPoint
}): FocalPoint | undefined {
  if (queryFocalPoint) {
    // Query values arrive as strings.
    return { x: Number(queryFocalPoint.x), y: Number(queryFocalPoint.y) }
  }

  // Form data can send numbers as strings.
  const x =
    isNumber(incoming.focalX) && Number(incoming.focalX) !== current?.focalX
      ? Number(incoming.focalX)
      : undefined
  const y =
    isNumber(incoming.focalY) && Number(incoming.focalY) !== current?.focalY
      ? Number(incoming.focalY)
      : undefined

  if (x === undefined && y === undefined) {
    return undefined
  }

  return { x: x ?? currentFocalPoint.x, y: y ?? currentFocalPoint.y }
}

/**
 * Applies the legacy inputs to the next `_transforms` value, in this order:
 * 1. An admin editor crop (percent of the original) sets or removes `crop`.
 * 2. A focal point written through `focalX`/`focalY` or the query is saved when it changes. A
 *    submitted `_transforms.focalPoint` wins over it.
 * 3. The first write on a document saved before `_transforms` existed keeps its focal point.
 *    The center means the same as no focal point, so it is not copied.
 */
export function applyLegacyEdits({
  adminCrop,
  currentFocalPoint,
  focalPointWrite,
  isLegacyDocument,
  original,
  state,
  submitted,
}: {
  adminCrop?: UploadEdits['crop']
  currentFocalPoint: FocalPoint
  focalPointWrite?: FocalPoint
  isLegacyDocument: boolean
  original?: Dimensions
  /** The next value from the general rules. */
  state: TransformState
  submitted?: TransformState
}): TransformState {
  let next = state

  if (adminCrop && original) {
    const { crop: _crop, ...rest } = next ?? {}
    next = isFullCrop(adminCrop)
      ? rest
      : { ...rest, crop: cropToPixels({ crop: adminCrop, original }) }
  }

  const writtenFocalPoint = submitted?.focalPoint ?? focalPointWrite
  if (writtenFocalPoint && !isDeepStrictEqual(writtenFocalPoint, currentFocalPoint)) {
    next = { ...next, focalPoint: writtenFocalPoint }
  }

  if (
    next &&
    !next.focalPoint &&
    isLegacyDocument &&
    !isDeepStrictEqual(currentFocalPoint, centerFocalPoint)
  ) {
    next = { ...next, focalPoint: currentFocalPoint }
  }

  return next
}

/**
 * The focal point that `focalX`/`focalY` and the pipeline use. A state without a focal point uses
 * the center, unless it never had one. A new file starts from the center too: the stored focal
 * point belongs to the replaced file. A submitted `null` removes all edits, including a focal point
 * saved before `_transforms` existed.
 */
export function getNextFocalPoint({
  currentFocalPoint,
  hasNewFile,
  next,
  previous,
  submitted,
}: {
  currentFocalPoint: FocalPoint
  hasNewFile: boolean
  next: TransformState
  previous: TransformState
  submitted?: TransformState
}): {
  hasChange: boolean
  /** `focalX`, `focalY` and the pipeline use whole numbers; `_transforms` keeps the exact value. */
  rounded: FocalPoint
} {
  const nextFocalPoint =
    next?.focalPoint ??
    (previous?.focalPoint || hasNewFile || submitted === null
      ? centerFocalPoint
      : currentFocalPoint)

  return {
    hasChange: !isDeepStrictEqual(nextFocalPoint, currentFocalPoint),
    rounded: { x: Math.round(nextFocalPoint.x), y: Math.round(nextFocalPoint.y) },
  }
}

/**
 * The edits for the upload pipeline. Without a query crop, the crop comes from the saved state:
 * a changed crop or focal point reprocesses the original, and an unchanged crop does not. A
 * removed crop is sent as a crop of the whole original: the rebuild decision and the crop reset
 * (`getCropResetAndFocalPointChange`) read it that way, and the upload bridge gets its size.
 */
export function toPipelineEdits({
  hasFocalPointChange,
  hasNewFile,
  next,
  nextFocalPoint,
  original,
  parsedEdits,
  previous,
}: {
  hasFocalPointChange: boolean
  hasNewFile: boolean
  next: TransformState
  nextFocalPoint: FocalPoint
  original?: Dimensions
  parsedEdits: UploadEdits
  previous: TransformState
}): UploadEdits {
  let edits = parsedEdits

  if (parsedEdits?.focalPoint || hasFocalPointChange) {
    edits = { ...edits, focalPoint: nextFocalPoint }
  }

  if (!original) {
    return edits
  }

  // A rebuilt file rebuilds its sizes, which must keep the saved focal point.
  const savedFocalPoint = isDeepStrictEqual(nextFocalPoint, centerFocalPoint)
    ? undefined
    : { focalPoint: nextFocalPoint }

  // A query crop is applied as sent: its `widthInPixels`/`heightInPixels` can also resize it.
  if (edits?.crop) {
    return { ...savedFocalPoint, ...edits }
  }

  const hasCropChange = !isDeepStrictEqual(previous?.crop, next?.crop)

  if (next?.crop && (hasNewFile || hasCropChange || hasFocalPointChange)) {
    return { ...savedFocalPoint, ...edits, ...toCropEdits({ crop: next.crop, original }) }
  }

  if (previous?.crop && !next?.crop) {
    return {
      ...savedFocalPoint,
      ...edits,
      crop: fullCrop,
      heightInPixels: original.height,
      widthInPixels: original.width,
    }
  }

  return edits
}

/**
 * The edits for a rebuild from the retained original. Another key can cause the rebuild, so the
 * saved crop and focal point are applied again, unless the edits already set them. Without the
 * focal point, the sizes would be built around the center.
 */
export function withSavedEdits({
  edits,
  original,
  transforms,
}: {
  edits: UploadEdits
  original: { height?: null | number; width?: null | number }
  transforms: TransformState | undefined
}): UploadEdits {
  const savedCrop = transforms?.crop
  const savedFocalPoint = transforms?.focalPoint
  const canApplySavedCrop = !edits?.crop && savedCrop && original.width && original.height

  return {
    ...edits,
    ...(canApplySavedCrop
      ? toCropEdits({
          crop: savedCrop,
          original: { height: original.height!, width: original.width! },
        })
      : {}),
    ...(!edits?.focalPoint && savedFocalPoint ? { focalPoint: savedFocalPoint } : {}),
  }
}

/**
 * A crop or resize in the edits, or a focal point that differs from the one in `fileData`. These
 * triggers rebuilt the stored file before `_transforms` existed.
 */
export function hasLegacyCropOrFocalPointEdit({
  fileData,
  uploadEdits,
}: {
  fileData: Record<string, unknown> | undefined
  uploadEdits: undefined | UploadEdits
}): boolean {
  if (!fileData || !uploadEdits) {
    return false
  }

  if (hasCropOrResizeEdit(uploadEdits)) {
    return true
  }

  // Since uploadEdits always has focalPoint, compare to the value in the data if it was changed
  if (uploadEdits.focalPoint) {
    const currentFocalX = 'focalX' in fileData && fileData.focalX
    const currentFocalY = 'focalY' in fileData && fileData.focalY

    return !(
      uploadEdits.focalPoint.x === currentFocalX && uploadEdits.focalPoint.y === currentFocalY
    )
  }

  return false
}

/**
 * Whether the edits reset the crop of a document that keeps its original, and whether they change
 * the focal point. A crop reset is a crop of the whole original at its own size. With no other
 * change it reuses the retained original, so the upload bridge does not get its crop size.
 */
export function getCropResetAndFocalPointChange({
  currentFileData,
  retainedOriginal,
  uploadEdits,
}: {
  currentFileData?: FileData
  retainedOriginal?: OriginalFileData
  uploadEdits: UploadEdits
}): {
  /**
   * The pixel size of the crop in the edits, which a request can send apart from the crop itself.
   * The upload bridge reads the crop from `_transforms`, so only this size is passed to it.
   */
  cropSize?: { height: number; width: number }
  hasFocalPointChange: boolean
  isResettingCrop: boolean
} {
  const crop = uploadEdits?.crop
  const isResettingCrop = Boolean(
    retainedOriginal &&
    crop &&
    isFullCrop(crop) &&
    (uploadEdits.widthInPixels === undefined ||
      Number(uploadEdits.widthInPixels) === retainedOriginal.width) &&
    (uploadEdits.heightInPixels === undefined ||
      Number(uploadEdits.heightInPixels) === retainedOriginal.height),
  )
  const hasFocalPointChange = Boolean(
    uploadEdits?.focalPoint &&
    (Number(uploadEdits.focalPoint.x) !== (currentFileData?.focalX ?? 50) ||
      Number(uploadEdits.focalPoint.y) !== (currentFileData?.focalY ?? 50)),
  )

  return {
    cropSize: isResettingCrop ? undefined : getCropSize({ edits: uploadEdits }),
    hasFocalPointChange,
    isResettingCrop,
  }
}

/** A saved crop in pixels as the `uploadEdits` crop: percent, plus its output size in pixels. */
function toCropEdits({
  crop,
  original,
}: {
  crop: NonNullable<NonNullable<TransformState>['crop']>
  original: Dimensions
}): Pick<UploadEdits, 'crop' | 'heightInPixels' | 'widthInPixels'> {
  return {
    crop: cropToPercent({ crop, original }),
    heightInPixels: crop.height,
    widthInPixels: crop.width,
  }
}

/** The crop size in the edits, when the edits have a crop and both pixel sizes. */
function getCropSize({
  edits,
}: {
  edits: undefined | UploadEdits
}): { height: number; width: number } | undefined {
  if (!edits?.crop || edits.widthInPixels === undefined || edits.heightInPixels === undefined) {
    return undefined
  }

  return { height: Number(edits.heightInPixels), width: Number(edits.widthInPixels) }
}
