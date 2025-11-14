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
  const result = path.split('.').reduce((o, i) => o?.[i] as Record<string, unknown>, obj)
  return result === undefined ? defaultValue! : (result as T)
}
