import type { Document, FocalPoint } from 'payload'

import { isNumber } from 'payload/shared'

/** A saved crop: whole pixels on the original file. */
export type SavedCrop = { height: number; width: number; x: number; y: number }

const centerFocalPoint: FocalPoint = { x: 50, y: 50 }

/** The crop saved in `doc._transforms`, or `undefined` when there is none. */
export function getSavedCrop({ doc }: { doc?: Document }): SavedCrop | undefined {
  const crop = getTransforms({ doc })?.crop

  if (
    crop &&
    isNumber(crop.height) &&
    isNumber(crop.width) &&
    isNumber(crop.x) &&
    isNumber(crop.y)
  ) {
    return { height: crop.height, width: crop.width, x: crop.x, y: crop.y }
  }
}

/**
 * The focal point saved in `doc._transforms`, rounded to whole percent as `focalX`/`focalY` are.
 * A document saved before `_transforms` existed has only `focalX`/`focalY`. With neither, the
 * center.
 */
export function getSavedFocalPoint({ doc }: { doc?: Document }): FocalPoint {
  const focalPoint = getTransforms({ doc })?.focalPoint

  if (focalPoint && isNumber(focalPoint.x) && isNumber(focalPoint.y)) {
    return { x: Math.round(focalPoint.x), y: Math.round(focalPoint.y) }
  }

  if (isNumber(doc?.focalX) && isNumber(doc?.focalY)) {
    return { x: Math.round(doc.focalX), y: Math.round(doc.focalY) }
  }

  return centerFocalPoint
}

function getTransforms({ doc }: { doc?: Document }):
  | {
      crop?: Partial<Record<keyof SavedCrop, unknown>>
      focalPoint?: { x?: unknown; y?: unknown }
    }
  | undefined {
  const transforms = doc?._transforms

  return transforms && typeof transforms === 'object' && !Array.isArray(transforms)
    ? transforms
    : undefined
}
