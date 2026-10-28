/**
 *
 * @deprecated use getObjectDotNotation from `'payload/shared'` instead of `'payload'`
 *
 * @example
 *
 * ```ts
 * import { getObjectDotNotation } from 'payload/shared'
 *
 * const obj = { a: { b: { c: 42 } } }
 * const value = getObjectDotNotation<number>(obj, 'a.b.c', 0) // value is 42
 * const defaultValue = getObjectDotNotation<number>(obj, 'a.b.x', 0) // defaultValue is 0
 * ```
 */
export const getObjectDotNotation = <T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T,
): T => {
  if (!path || !obj) {
    return defaultValue!
  }

  let result: unknown = obj

  for (const segment of path.split('.')) {
    if (result === null || typeof result !== 'object' || !Object.hasOwn(result, segment)) {
      return defaultValue!
    }

    result = (result as Record<string, unknown>)[segment]
  }

  return result === undefined ? defaultValue! : (result as T)
}
