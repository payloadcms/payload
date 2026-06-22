import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'

/**
 * Builds the client-side `ServerFunctionClient` wired into
 * `RootProvider.serverFunction`, given the app's `createServerFn`-based
 * dispatcher (`runServerFn`).
 *
 * Strips functions / symbols / RegExps / React elements from the args before
 * dispatching: the previous `fetch + JSON.stringify` pipeline silently dropped
 * those, but TanStack Start's seroval-based wire format errors instead. We
 * mirror the relaxed behaviour so existing callers (e.g. `getFormState` in
 * `ServerFunctionsProvider`) that may pass the live form state — which can
 * carry stray functions — keep working without each call site sanitising.
 *
 * Delegates to `runServerFn`, so the response (including any RSC handles for
 * server-rendered custom components) is decoded by TanStack Start back into
 * renderable React nodes on the client.
 */
export function createServerFunctionClient({
  runServerFn,
}: {
  runServerFn: (input: { data: ServerFunctionClientArgs }) => Promise<unknown>
}): ServerFunctionClient {
  return (async (args: ServerFunctionClientArgs) => {
    const safeArgs = stripUnserializable(args) as ServerFunctionClientArgs
    return await runServerFn({ data: safeArgs })
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
      result[key] = v
    }
  }
  ancestors.delete(obj)
  return result
}
