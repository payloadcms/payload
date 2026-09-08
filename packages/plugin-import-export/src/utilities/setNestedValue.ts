import { APIError } from 'payload'

import { hasUnsupportedFieldPathSegment } from './fieldPath.js'

const MAX_UNVERIFIED_SPARSE_ARRAY_GAP = 1

const createObject = (): Record<string, unknown> => Object.create(null) as Record<string, unknown>

const isArrayIndex = (part: string): boolean => {
  if (!/^(?:0|[1-9]\d*)$/.test(part)) {
    return false
  }

  const index = Number(part)

  return Number.isSafeInteger(index) && index >= 0
}

const getPathKey = (
  target: Record<string, unknown> | unknown[],
  part: string,
  source: unknown,
): number | string => {
  if (!Array.isArray(target) || !isArrayIndex(part)) {
    return part
  }

  const index = Number(part)

  if (
    (Array.isArray(source) && index >= source.length) ||
    (!Array.isArray(source) && index > target.length + MAX_UNVERIFIED_SPARSE_ARRAY_GAP)
  ) {
    throw new APIError('Invalid field path.', 400, null, true)
  }

  return index
}

const getSourceValue = (source: unknown, part: string): unknown => {
  if (source === null || typeof source !== 'object') {
    return undefined
  }

  const key = Array.isArray(source) && isArrayIndex(part) ? Number(part) : part

  return (source as Record<number | string, unknown>)[key]
}

/**
 * Sets a value deeply into a nested object or array, based on a dot-notation path.
 *
 * This function:
 * - Supports array indexing (e.g., "array.0.field1")
 * - Creates intermediate arrays/objects as needed
 * - Mutates the target object directly
 *
 * @example
 * const obj = {}
 * setNestedValue(obj, 'group.array.0.field1', 'hello')
 * // Result: { group: { array: [ { field1: 'hello' } ] } }
 *
 * @param obj - The target object to mutate.
 * @param path - A dot-separated string path indicating where to assign the value.
 * @param value - The value to set at the specified path.
 * @param source - The source object used to validate array boundaries.
 */

export const setNestedValue = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
  source?: Record<string, unknown>,
): void => {
  const parts = path.split('.')

  if (hasUnsupportedFieldPathSegment(parts)) {
    throw new APIError('Invalid field path.', 400, null, true)
  }

  const lastPart = parts.pop()

  if (lastPart === undefined) {
    return
  }

  let current: Record<string, unknown> | unknown[] = obj
  let sourceCurrent: unknown = source

  for (const [i, part] of parts.entries()) {
    const key = getPathKey(current, part, sourceCurrent)
    const currentRecord = current as Record<number | string, unknown>
    const nextPart = parts[i + 1] ?? lastPart
    const nextSource = getSourceValue(sourceCurrent, part)

    const nextValue = currentRecord[key]

    if (
      !Object.prototype.hasOwnProperty.call(currentRecord, key) ||
      typeof nextValue !== 'object' ||
      nextValue === null
    ) {
      currentRecord[key] = isArrayIndex(nextPart) ? [] : createObject()
    }

    current = currentRecord[key] as Record<string, unknown> | unknown[]
    sourceCurrent = nextSource
  }

  const lastKey = getPathKey(current, lastPart, sourceCurrent)
  const finalRecord = current as Record<number | string, unknown>

  finalRecord[lastKey] = value
}
