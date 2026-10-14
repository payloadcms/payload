import { setOwnProperty } from 'payload/shared'

/** Removes values that Payload can accidentally include but Seroval cannot transport. */
export function stripUnserializable(
  value: unknown,
  ancestors: WeakSet<object> = new WeakSet(),
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

  if (!Array.isArray(value) && !isPlainRecord(value)) {
    return value
  }

  if (ancestors.has(value)) {
    return undefined
  }

  ancestors.add(value)

  const result: Record<string, unknown> | unknown[] = Array.isArray(value) ? [] : {}
  const source = value as Record<string, unknown>

  for (const key of Object.keys(source)) {
    const serialized = stripUnserializable(source[key], ancestors)
    if (Array.isArray(result)) {
      result.push(serialized)
    } else if (serialized !== undefined) {
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
