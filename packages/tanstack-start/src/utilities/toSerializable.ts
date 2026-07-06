/**
 * Recursively strip values that seroval cannot serialize (React elements,
 * functions, Symbols) while preserving Maps, Sets, Dates, typed arrays, etc.
 *
 * TanStack Start uses seroval to transfer server function return values to
 * the client.  Payload's `getClientConfig` / `getLayoutData` may include
 * callback functions or RegExp instances that seroval chokes on.  Running
 * the data through this function before returning from a `createServerFn`
 * handler keeps the transfer safe.
 *
 * For server functions whose payloads contain React elements (e.g. the
 * shared `form-state` / `render-list` / `render-document` handlers), use
 * `serializeForRsc` instead — it converts elements into RSC handles rather
 * than stripping them.
 *
 * Uses a WeakMap cache so that shared object references (e.g. the same array
 * referenced by both `doc.hasMany` and `formState.hasMany.value`) are
 * returned correctly instead of being dropped as "already seen".
 *
 * A separate `ancestors` WeakSet tracks objects currently being recursed into.
 * If an object is encountered while it is still on the recursion stack, the
 * reference is circular and is replaced with `undefined` to keep the output
 * JSON-safe.  Once recursion completes the object is removed from `ancestors`,
 * so sibling/cousin references to the same (fully-processed) object still
 * resolve to the cached clone.
 */
function stripUnserializable(
  value: unknown,
  cache = new WeakMap<object, unknown>(),
  ancestors = new WeakSet<object>(),
): unknown {
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

  if (ancestors.has(obj)) {
    return undefined
  }

  if (cache.has(obj)) {
    return cache.get(obj)
  }

  if (obj instanceof Date) {
    return obj
  }

  // RegExp: seroval's SSR bootstrap emits regex literals with broken escape
  // sequences (e.g. `/!\\[.../` instead of `/!\[.../`), crashing the client
  // script that populates `window.$_TSR` and preventing hydration. Rich-text
  // feature transformer regexes aren't needed on the client (they drive
  // server-side markdown import/export), so strip them here.
  if (obj instanceof RegExp) {
    return undefined
  }

  ancestors.add(obj)

  if (obj instanceof Map) {
    const cleaned = new Map()
    cache.set(obj, cleaned)
    for (const [k, v] of obj) {
      const cv = stripUnserializable(v, cache, ancestors)
      if (cv !== undefined) {
        cleaned.set(k, cv)
      }
    }
    ancestors.delete(obj)
    return cleaned
  }

  if (obj instanceof Set) {
    const cleaned = new Set()
    cache.set(obj, cleaned)
    for (const v of obj) {
      const cv = stripUnserializable(v, cache, ancestors)
      if (cv !== undefined) {
        cleaned.add(cv)
      }
    }
    ancestors.delete(obj)
    return cleaned
  }

  if (Array.isArray(obj)) {
    const arr: unknown[] = []
    cache.set(obj, arr)
    for (const item of obj) {
      arr.push(stripUnserializable(item, cache, ancestors))
    }
    ancestors.delete(obj)
    return arr
  }

  if (ArrayBuffer.isView(obj)) {
    ancestors.delete(obj)
    return obj
  }

  const result: Record<string, unknown> = {}
  cache.set(obj, result)
  for (const key of Object.keys(obj)) {
    const v = stripUnserializable(obj[key], cache, ancestors)
    if (v !== undefined) {
      result[key] = v
    }
  }
  ancestors.delete(obj)
  return result
}

export function toSerializable<T>(value: T): T {
  return stripUnserializable(value) as T
}
