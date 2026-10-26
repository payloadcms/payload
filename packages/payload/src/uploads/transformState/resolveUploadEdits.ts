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

/**
 * Combines `_transforms`, the `uploadEdits` query and `focalX`/`focalY` into one result:
 * the edits the upload pipeline applies, and a function that writes the saved `_transforms`
 * (with `focalX`/`focalY` kept in sync) onto the generated file data.
 */
export async function resolveUploadEdits({
  collectionSlug,
  data,
  focalPointEnabled,
  isDuplicating,
  operation,
  originalDoc,
  req,
}: {
  collectionSlug: string
  data: unknown
  focalPointEnabled: boolean
  isDuplicating?: boolean
  operation: 'create' | 'update'
  originalDoc: unknown
  req: PayloadRequest
}): Promise<{ applyTransformState: <T>(fileData: T) => T; uploadEdits: UploadEdits }> {
  let uploadEdits = parseUploadEditsFromReqOrIncomingData({
    data,
    isDuplicating,
    operation,
    // Only a duplication source informs edit parsing. Updates now also pass `originalDoc` so the
    // stored file can be reprocessed, and that must not change which edits are applied.
    originalDoc: isDuplicating ? originalDoc : undefined,
    req,
  })

  // A duplicate copies `_transforms` with the rest of the document and reprocesses nothing new.
  if (isDuplicating) {
    return { applyTransformState: (fileData) => fileData, uploadEdits }
  }

  const incoming = (data ?? {}) as Document
  const current = (operation === 'update' ? originalDoc : undefined) as Document
  const hasNewFile = Boolean(req.file)
  // Crop coordinates belong to the replaced file, so a new file starts without them.
  const previous: TransformState = hasNewFile ? null : (current?._transforms ?? null)
  const isSubmitted = Object.prototype.hasOwnProperty.call(incoming, '_transforms')
  let next: TransformState = isSubmitted
    ? structuredClone((incoming._transforms as TransformState) ?? null)
    : previous

  let original: Dimensions | undefined = current?.original
  if (hasNewFile && next?.crop) {
    original = await getImageSize({ file: req.file }).catch(() => undefined)
  }

  if (isSubmitted) {
    const message =
      next?.crop && !original
        ? 'crop: needs an image with known dimensions'
        : await getTransformStateError({ original, value: next })

    if (message) {
      throw new ValidationError(
        { collection: collectionSlug, errors: [{ message, path: '_transforms' }], req },
        req.t,
      )
    }
  }

  const queryEdits = req.query?.uploadEdits as undefined | UploadEdits
  const hasLegacyFocalWrite = Boolean(
    queryEdits?.focalPoint || (isNumber(incoming.focalX) && isNumber(incoming.focalY)),
  )
  const currentFocalPoint: FocalPoint | undefined =
    previous?.focalPoint ??
    (isNumber(current?.focalX) && isNumber(current?.focalY)
      ? { x: current.focalX, y: current.focalY }
      : undefined)
  // Query values arrive as strings.
  const legacyFocalPoint =
    hasLegacyFocalWrite && uploadEdits?.focalPoint
      ? { x: Number(uploadEdits.focalPoint.x), y: Number(uploadEdits.focalPoint.y) }
      : undefined
  const requestedFocalPoint = (isSubmitted ? next?.focalPoint : undefined) ?? legacyFocalPoint
  // Clearing a saved focal point moves it back to the center.
  const focalPoint =
    requestedFocalPoint ??
    (previous?.focalPoint && !next?.focalPoint ? centerFocalPoint : undefined)
  const hasFocalPointChange = Boolean(
    focalPoint && !isDeepStrictEqual(focalPoint, currentFocalPoint),
  )

  if (requestedFocalPoint && hasFocalPointChange) {
    next = { ...next, focalPoint: requestedFocalPoint }
  }
  if (focalPoint) {
    uploadEdits = { ...uploadEdits, focalPoint }
  }

  if (!queryEdits?.crop && original) {
    const hasCropChange = !isDeepStrictEqual(previous?.crop, next?.crop)

    if (next?.crop && (hasNewFile || hasCropChange || hasFocalPointChange)) {
      uploadEdits = {
        ...uploadEdits,
        crop: cropToPercent({ crop: next.crop, original }),
        heightInPixels: next.crop.height,
        widthInPixels: next.crop.width,
      }
    } else if (previous?.crop && !next?.crop) {
      uploadEdits = {
        ...uploadEdits,
        crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
        heightInPixels: original.height,
        widthInPixels: original.width,
      }
    }
  }

  const applyTransformState = <T>(fileData: T): T => {
    const result = fileData as Document
    let state = next

    // The admin editor sends its crop as percentages of the original.
    if (queryEdits?.crop) {
      const { crop: _previousCrop, ...rest } = state ?? {}
      const cropOriginal: Dimensions | undefined = result.original ?? original

      state = isFullCrop(queryEdits.crop)
        ? rest
        : cropOriginal
          ? { ...rest, crop: cropToPixels({ crop: queryEdits.crop, original: cropOriginal }) }
          : state
    }

    const savedFocalPoint = state?.focalPoint ?? focalPoint

    return {
      ...result,
      ...(focalPointEnabled && savedFocalPoint
        ? { focalX: Math.round(savedFocalPoint.x), focalY: Math.round(savedFocalPoint.y) }
        : {}),
      _transforms: state && Object.keys(state).length ? state : null,
    } as T
  }

  return { applyTransformState, uploadEdits }
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
