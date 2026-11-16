import type { Where } from '../types/index.js'

/**
 * Checks whether a relationship operator value is a nested `where` query.
 *
 * Nested queries are plain objects. Class instances, such as a MongoDB `ObjectId`, are values even
 * though JavaScript also reports them as objects.
 *
 * @example
 * ```ts
 * isNestedRelationshipQuery({ name: { equals: 'recalls' } }) // true
 * ```
 */
export function isNestedRelationshipQuery(value: unknown): value is Where {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}
