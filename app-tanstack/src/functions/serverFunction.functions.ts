import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'

import { createServerFn } from '@tanstack/react-start'

/**
 * TanStack Start server function that dispatches to the shared Payload server
 * function registry (form-state, table-state, render-document, etc.) using the
 * RSC payload format — matching the Next.js adapter.
 *
 * Why a `createServerFn` instead of a hand-rolled `/api/server-function` JSON
 * route: server-rendered custom field components (returned by `buildFormState`
 * via `RenderServerComponent`) live as React elements inside the response. Raw
 * `JSON.stringify` strips them. TanStack Start's `createServerFn` wire format
 * uses seroval + an `$RSC` serialization adapter that serializes "RSC handles"
 * produced by `renderServerComponent` as Flight streams. The package's
 * `handleServerFunctions` runs the result through `serializeForRsc` to convert
 * React elements into those handles before they cross the wire.
 */
export const runPayloadServerFn = createServerFn({ method: 'POST' })
  .inputValidator((args: ServerFunctionClientArgs): ServerFunctionClientArgs => args)
  .handler(async ({ data }) => {
    const { handleServerFunctions } = await import('@payloadcms/tanstack-start/server')
    const config = (await import('@payload-config')).default
    const { importMap } = await import('../importMap.js')

    return (await handleServerFunctions({
      name: data.name,
      args: data.args,
      config,
      importMap,
    })) as any
  })

/**
 * Client-side server function handler wired into `RootProvider.serverFunction`.
 *
 * Strips functions / symbols / RegExps / React elements from the args before
 * dispatching: the previous `fetch + JSON.stringify` pipeline silently dropped
 * those, but TanStack Start's seroval-based wire format errors instead. We
 * mirror the relaxed behaviour so existing callers (e.g. `getFormState` in
 * `ServerFunctionsProvider`) that may pass the live form state — which can
 * carry stray functions — keep working without each call site sanitising.
 *
 * Delegates to `runPayloadServerFn`, so the response (including any RSC handles
 * for server-rendered custom components) is decoded by TanStack Start back into
 * renderable React nodes on the client.
 */
export const serverFunctionHandler: ServerFunctionClient = async (
  args: ServerFunctionClientArgs,
) => {
  const safeArgs = stripUnserializable(args) as ServerFunctionClientArgs
  return (await runPayloadServerFn({ data: safeArgs })) as ReturnType<ServerFunctionClient>
}

function stripUnserializable(
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
