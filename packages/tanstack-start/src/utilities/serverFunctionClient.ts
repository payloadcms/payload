import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'

import { setOwnProperty } from 'payload/shared'

/** Builds the admin dispatcher with native Flight response decoding. */
export function createServerFunctionClient({
  runServerFn,
}: {
  runServerFn: (input: { data: ServerFunctionClientArgs }) => Promise<Response>
}): ServerFunctionClient {
  return (async (args: ServerFunctionClientArgs) => {
    const safeArgs = stripUnserializable(args) as ServerFunctionClientArgs
    const response = await runServerFn({ data: safeArgs })

    if (!response.ok) {
      throw new Error(`Payload server function failed with status ${response.status}`)
    }

    if (response.headers.get('content-type')?.split(';')[0]?.trim() !== 'text/x-component') {
      throw new Error('Expected a React Flight response from the Payload server function')
    }

    if (!response.body) {
      throw new Error('The Payload server function returned an empty Flight response')
    }

    const { createFromReadableStream } = await import('@tanstack/react-start/rsc')

    return await createFromReadableStream(response.body)
  }) as ServerFunctionClient
}

/**
 * Recursively removes values TanStack Start's seroval wire format cannot
 * serialize (functions, symbols, RegExps, React elements, cyclic refs) and
 * normalizes `Date` subclasses to plain `Date`.
 */
export function stripUnserializable(
  value: unknown,
  cache: WeakMap<object, unknown> = new WeakMap(),
  ancestors: WeakSet<object> = new WeakSet(),
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
    // Normalize to a plain `Date`. Subclasses (e.g. `@date-fns/tz`'s `TZDate`,
    // used by the schedule-publish drawer) are `instanceof Date` but have a
    // different `constructor`, which TanStack Start's seroval serializer
    // rejects with "The value [object Date] ... cannot be parsed/serialized".
    return new Date(obj.getTime())
  }

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
      setOwnProperty({ key, target: result, value: v })
    }
  }
  ancestors.delete(obj)
  return result
}
