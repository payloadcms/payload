import type { Document, PayloadRequest } from '../../types/index.js'
import type { FocalPoint } from '../types.js'
import type { PixelCrop } from './cropUnits.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { getImageSize } from '../getImageSize.js'
import { getTransformStateError } from './validateTransformState.js'

export type TransformState = {
  [key: string]: unknown
  crop?: PixelCrop
  focalPoint?: FocalPoint
} | null

export type Dimensions = { height: number; width: number }

/**
 * The submitted `_transforms` in the form JSON stores it, so validation and processing see the
 * value that is saved. `undefined` when no value was sent. Throws for a value that JSON cannot
 * store exactly.
 */
export function readSubmittedTransformState({
  collectionSlug,
  incoming,
  req,
}: {
  collectionSlug: string
  incoming: Document
  req: PayloadRequest
}): TransformState | undefined {
  // `undefined` means not sent, as in JSON and as Local API callers often pass an unset key.
  if (incoming._transforms === undefined) {
    return undefined
  }

  const nonJSONValueError = getNonJSONValueError({ value: incoming._transforms })

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

  return JSON.parse(JSON.stringify(incoming._transforms ?? null)) as TransformState
}

/** Checks a submitted `_transforms`. A crop needs the original's size. */
export async function assertValidTransformState({
  collectionSlug,
  original,
  req,
  submitted,
}: {
  collectionSlug: string
  original?: Dimensions
  req: PayloadRequest
  submitted: TransformState
}): Promise<void> {
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

/** A submitted value replaces the previous one. */
export function getNextTransformState({
  previous,
  submitted,
}: {
  previous: TransformState
  submitted?: TransformState
}): TransformState {
  return submitted === undefined ? previous : submitted
}

/** The value to save. An empty object becomes `null`. */
export function toSavedTransformState({ state }: { state: TransformState }): TransformState {
  return state && Object.keys(state).length ? state : null
}

/** The original's size: the new file, the retained original, or the main file of an older upload. */
export async function getOriginalDimensions({
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
 * An error for the first value that JSON cannot store exactly, such as `NaN`, `Infinity` or a
 * `BigInt`. Without this check, the JSON copy would save `null` in its place or throw.
 */
export function getNonJSONValueError({
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
