/**
 * Recursively strip values that seroval cannot serialize (React elements,
 * functions, Symbols) while preserving Maps, Sets, Dates, typed arrays, etc.
 *
 * TanStack Start uses seroval to transfer server function return values to
 * the client.  Payload's `getClientConfig` / `getAdminPageData` may include
 * React elements (with `$$typeof: Symbol(...)`) or callback functions that
 * seroval chokes on.  Running the data through this function before returning
 * from a `createServerFn` handler keeps the transfer safe.
 */
function stripUnserializable(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || value === undefined) {
    return value
  }

  const t = typeof value
  if (t === 'function' || t === 'symbol') {
    return undefined
  }
  if (t !== 'object') {
    return value
  }

  const obj = value as Record<string, unknown>

  if (typeof obj.$$typeof === 'symbol') {
    return undefined
  }

  if (seen.has(obj)) {
    return undefined
  }
  seen.add(obj)

  if (obj instanceof Date || obj instanceof RegExp) {
    return obj
  }

  if (obj instanceof Map) {
    const cleaned = new Map()
    for (const [k, v] of obj) {
      const cv = stripUnserializable(v, seen)
      if (cv !== undefined) {
        cleaned.set(k, cv)
      }
    }
    return cleaned
  }

  if (obj instanceof Set) {
    const cleaned = new Set()
    for (const v of obj) {
      const cv = stripUnserializable(v, seen)
      if (cv !== undefined) {
        cleaned.add(cv)
      }
    }
    return cleaned
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => stripUnserializable(item, seen))
  }

  if (ArrayBuffer.isView(obj)) {
    return obj
  }

  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const v = stripUnserializable(obj[key], seen)
    if (v !== undefined) {
      result[key] = v
    }
  }
  return result
}

export function toSerializable<T>(value: T): T {
  return stripUnserializable(value) as T
}
