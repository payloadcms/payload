import { setOwnProperty } from 'payload/shared'

/** Removes values that Payload can accidentally include but Seroval cannot transport. */
export function stripUnserializable(
  value: unknown,
  ancestors: WeakSet<object> = new WeakSet(),
  cache: WeakMap<object, unknown> = new WeakMap(),
): unknown {
  if (value === null || value === undefined) {
    return value
  }

  const type = typeof value

  if (type === 'function' || type === 'symbol') {
    return undefined
  }

  if (type !== 'object') {
    return value
  }

  if (isReactElement(value)) {
    return undefined
  }

  if (value instanceof Date) {
    return value.constructor === Date ? value : new Date(value.getTime())
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return undefined
  }

  if (value instanceof Map || value instanceof Set) {
    if (ancestors.has(value)) {
      return undefined
    }

    if (cache.has(value)) {
      return cache.get(value)
    }

    ancestors.add(value)

    if (value instanceof Map) {
      const result = new Map()
      cache.set(value, result)

      for (const [key, item] of value) {
        const serializedKey = stripUnserializable(key, ancestors, cache)
        const serializedItem = stripUnserializable(item, ancestors, cache)

        if ((key === undefined || serializedKey !== undefined) && serializedItem !== undefined) {
          result.set(serializedKey, serializedItem)
        }
      }

      ancestors.delete(value)
      return result
    }

    const result = new Set()
    cache.set(value, result)

    for (const item of value) {
      const serialized = stripUnserializable(item, ancestors, cache)
      if (serialized !== undefined) {
        result.add(serialized)
      }
    }

    ancestors.delete(value)
    return result
  }

  if (!Array.isArray(value) && !isPlainRecord(value)) {
    return value
  }

  if (ancestors.has(value)) {
    return undefined
  }

  if (cache.has(value)) {
    return cache.get(value)
  }

  ancestors.add(value)

  const result: Record<string, unknown> | unknown[] = Array.isArray(value)
    ? new Array(value.length)
    : {}

  cache.set(value, result)

  const source = value as Record<string, unknown>

  for (const key of Object.keys(source)) {
    const serialized = stripUnserializable(source[key], ancestors, cache)

    if (serialized !== undefined) {
      setOwnProperty({ key, target: result, value: serialized })
    }
  }

  ancestors.delete(value)

  return result
}

function isPlainRecord(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isReactElement(value: object): boolean {
  return typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol'
}
