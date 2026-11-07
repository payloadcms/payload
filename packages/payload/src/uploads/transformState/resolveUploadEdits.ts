import { isDeepStrictEqual } from 'node:util'

import type { Document, PayloadRequest } from '../../types/index.js'
import type { FileData, FocalPoint, UploadEdits } from '../types.js'
import type { PixelCrop } from './cropUnits.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { isNumber } from '../../utilities/isNumber.js'
import { getImageSize } from '../getImageSize.js'
import { cropToPercent, cropToPixels, isFullCrop } from './cropUnits.js'
import { getTransformStateError } from './validateTransformState.js'

type TransformState = {
  [key: string]: unknown
  crop?: PixelCrop
  focalPoint?: FocalPoint
} | null

type Dimensions = { height: number; width: number }

const centerFocalPoint: FocalPoint = { x: 50, y: 50 }
const fullCrop = { height: 100, unit: '%', width: 100, x: 0, y: 0 } as const

/**
 * Combines `_transforms`, the `uploadEdits` query and `focalX`/`focalY` into the `_transforms`
 * value to save and the edits that the upload pipeline applies to the original.
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
  const parsedEdits = parseUploadEditsFromReqOrIncomingData({
    data,
    isDuplicating,
    operation,
    // Only a duplication source informs edit parsing. Updates now also pass `originalDoc` so the
    // stored file can be reprocessed, and that must not change which edits are applied.
    originalDoc: isDuplicating ? originalDoc : undefined,
    req,
  })

  // A duplicate is made from the source's cropped main file, which becomes the copy's original.
  // The crop is already part of those files, so the copy keeps every other key but not `crop`.
  if (isDuplicating) {
    const applyTransformState = <T>(fileData: T): T => {
      const { crop: _crop, ...rest } = ((fileData as Document)._transforms ?? {}) as Document

      return { ...fileData, _transforms: Object.keys(rest).length ? rest : null }
    }

    return { applyTransformState, uploadEdits: parsedEdits }
  }

  const incoming = (data ?? {}) as Document
  const current = (operation === 'update' ? originalDoc : undefined) as Document
  const file = fileArg ?? req.file
  const hasNewFile = Boolean(file)
  const queryEdits = req.query?.uploadEdits as undefined | UploadEdits
  // `undefined` means not sent, as in JSON and as Local API callers often pass an unset key.
  const isSubmitted = incoming._transforms !== undefined
  // Crop coordinates belong to the replaced file, so a new file starts without them.
  const previous: TransformState = hasNewFile ? null : (current?._transforms ?? null)
  const nonJSONValueError = isSubmitted
    ? getNonJSONValueError({ value: incoming._transforms })
    : undefined

  if (nonJSONValueError) {
    throw new ValidationError(
      {
        collection: collectionSlug,
        errors: [{ message: nonJSONValueError, path: '_transforms' }],
        req,
      },
      req.t,
    )
  }

  // Use the form JSON stores, so validation and processing see the value that is saved.
  const submitted = isSubmitted
    ? (JSON.parse(JSON.stringify(incoming._transforms ?? null)) as TransformState)
    : undefined
  const hasCrop = Boolean(submitted?.crop || queryEdits?.crop || previous?.crop)
  const original = hasCrop ? await getOriginalDimensions({ current, file }) : undefined

  if ((submitted?.crop || queryEdits?.crop) && !original && canWaitForFile) {
    return {
      applyTransformState: (fileData) => fileData,
      isWaitingForFile: true,
      uploadEdits: parsedEdits,
    }
  }

  if (isSubmitted) {
    const message =
      submitted?.crop && !original
        ? 'crop: needs an image with known dimensions'
        : await getTransformStateError({ original, value: submitted })

    if (message) {
      throw new ValidationError(
        { collection: collectionSlug, errors: [{ message, path: '_transforms' }], req },
        req.t,
      )
    }
  }

  const currentFocalPoint: FocalPoint =
    previous?.focalPoint ??
    (isNumber(current?.focalX) && isNumber(current?.focalY)
      ? { x: current.focalX, y: current.focalY }
      : centerFocalPoint)
  const next = resolveNextState({
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
    previous,
    submitted,
  })
  // A state without a focal point uses the center, unless it never had one. A new file starts
  // from the center too: the stored focal point belongs to the replaced file. `null` removes all
  // edits, including a focal point saved before `_transforms` existed.
  const nextFocalPoint =
    next?.focalPoint ??
    (previous?.focalPoint || hasNewFile || (isSubmitted && submitted === null)
      ? centerFocalPoint
      : currentFocalPoint)
  const hasFocalPointChange = !isDeepStrictEqual(nextFocalPoint, currentFocalPoint)
  // `focalX`, `focalY` and the pipeline use whole numbers; `_transforms` keeps the exact value.
  const roundedFocalPoint = { x: Math.round(nextFocalPoint.x), y: Math.round(nextFocalPoint.y) }

  const uploadEdits = toPipelineEdits({
    hasFocalPointChange,
    hasNewFile,
    next,
    nextFocalPoint: roundedFocalPoint,
    original,
    parsedEdits,
    previous,
  })

  const applyTransformState = <T>(fileData: T): T => ({
    ...fileData,
    ...(focalPointEnabled && (next?.focalPoint || hasFocalPointChange)
      ? { focalX: roundedFocalPoint.x, focalY: roundedFocalPoint.y }
      : {}),
    _transforms: next,
  })

  return { applyTransformState, uploadEdits }
}

/**
 * The `_transforms` value to save, in this order:
 * 1. The submitted value replaces the previous one.
 * 2. An admin editor crop (percent of the original) sets or removes `crop`.
 * 3. A focal point written through `focalX`/`focalY` or the query is saved when it changes.
 * 4. The first write on a document saved before `_transforms` existed keeps its focal point.
 *    The center means the same as no focal point, so it is not copied.
 * 5. An empty object becomes `null`.
 */
export function resolveNextState({
  adminCrop,
  currentFocalPoint,
  focalPointWrite,
  isLegacyDocument,
  original,
  previous,
  submitted,
}: {
  adminCrop?: UploadEdits['crop']
  currentFocalPoint: FocalPoint
  focalPointWrite?: FocalPoint
  isLegacyDocument: boolean
  original?: Dimensions
  previous: TransformState
  submitted?: TransformState
}): TransformState {
  let next = submitted === undefined ? previous : submitted

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

  return next && Object.keys(next).length ? next : null
}

/**
 * The edits for the upload pipeline. Without a query crop, the crop comes from the saved state:
 * a changed crop or focal point reprocesses the original, and an unchanged crop does not.
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
    return {
      ...savedFocalPoint,
      ...edits,
      crop: cropToPercent({ crop: next.crop, original }),
      heightInPixels: next.crop.height,
      widthInPixels: next.crop.width,
    }
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
 * The focal point written through the query or through `focalX`/`focalY`. Each of `focalX` and
 * `focalY` can be sent alone. The admin sends back the stored, rounded values on every save, so a
 * value equal to the stored one is not a write and the exact saved value is kept.
 */
function getFocalPointWrite({
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

/** The original's size: the new file, the retained original, or the main file of an older upload. */
async function getOriginalDimensions({
  current,
  file,
}: {
  current?: Document
  file?: PayloadRequest['file']
}): Promise<Dimensions | undefined> {
  if (file) {
    return getImageSize({ file }).catch(() => undefined)
  }

  const source = current?.original?.width ? current.original : current

  return source?.width && source?.height
    ? { height: source.height, width: source.width }
    : undefined
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

/**
 * An error for the first value that JSON cannot store exactly, such as `NaN`, `Infinity` or a
 * `BigInt`. Without this check, the JSON copy would save `null` in its place or throw.
 */
function getNonJSONValueError({
  path = [],
  value,
}: {
  path?: string[]
  value: unknown
}): string | undefined {
  const name = path.join('.')

  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return undefined
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? undefined : `${name}: must be a finite number`
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      // JSON stores a hole or `undefined` in an array as `null`.
      const error =
        item === undefined
          ? undefined
          : getNonJSONValueError({ path: [...path, String(index)], value: item })

      if (error) {
        return error
      }
    }

    return undefined
  }

  const prototype = typeof value === 'object' ? Object.getPrototypeOf(value) : undefined

  if (prototype === Object.prototype || prototype === null) {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      // JSON leaves out a property set to `undefined`, the same as a property that is not sent.
      const error =
        item === undefined ? undefined : getNonJSONValueError({ path: [...path, key], value: item })

      if (error) {
        return error
      }
    }

    return undefined
  }

  return `${name || '_transforms'}: must be a JSON value`
}
