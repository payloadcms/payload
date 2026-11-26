import type { Where } from '../types/index.js'

/**
 * Copies the plain objects and arrays that make up a `where` query. Every other value, such as a
 * `Date` or a MongoDB `ObjectId`, is kept by reference.
 *
 * Query validation rewrites the query it validates in place to apply access constraints, so
 * operations validate and run a copy. This leaves the caller's object untouched and safe to reuse.
 */
export function cloneWhere<TWhere extends undefined | Where>(where: TWhere): TWhere {
  return cloneQueryValue(where) as TWhere
}

function cloneQueryValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneQueryValue)
  }

  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {}

    for (const key of Object.keys(value)) {
      copy[key] = cloneQueryValue(value[key])
    }

    return copy
  }

  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}
