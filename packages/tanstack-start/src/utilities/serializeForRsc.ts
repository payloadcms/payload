import type React from 'react'

import { renderServerComponent } from '@tanstack/react-start/rsc'

/**
 * Recursively walk a server-function return value and prepare it for transit
 * to the client as an RSC payload.
 *
 * Mirrors `toSerializable`'s walk (Maps, Sets, Dates, typed arrays, circular
 * refs) with two key differences:
 *
 * 1. React elements are NOT stripped. They are passed through
 *    `renderServerComponent` from `@tanstack/react-start/rsc` to produce a
 *    "renderable RSC handle". TanStack Start's `$RSC` serialization adapter
 *    streams the underlying Flight payload to the client, where it is
 *    decoded back into a renderable React node. This matches the way
 *    Next.js's RSC payload format ships React elements over server actions
 *    and lets server-rendered custom field components (e.g. those returned
 *    by `buildFormState` / `RenderServerComponent`) survive a `form-state`
 *    round trip.
 *
 * 2. Functions, Symbols, and RegExps are still stripped — TanStack's seroval
 *    transport cannot handle them, and Payload doesn't intentionally include
 *    them in server-function return values.
 *
 * Use this in `createServerFn` handlers that return Payload form/view state
 * containing React elements (e.g. `state[path].customComponents.Field`).
 */
export async function serializeForRsc<T>(value: T): Promise<T> {
  return (await walk(value, new WeakMap<object, unknown>(), new WeakSet<object>())) as T
}

async function walk(
  value: unknown,
  cache: WeakMap<object, unknown>,
  ancestors: WeakSet<object>,
): Promise<unknown> {
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
    return await renderServerComponent(value as React.ReactElement)
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

  if (obj instanceof RegExp) {
    return undefined
  }

  ancestors.add(obj)

  if (obj instanceof Map) {
    const cleaned = new Map()
    cache.set(obj, cleaned)
    for (const [k, v] of obj) {
      const cv = await walk(v, cache, ancestors)
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
      const cv = await walk(v, cache, ancestors)
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
      arr.push(await walk(item, cache, ancestors))
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
    const v = await walk(obj[key], cache, ancestors)
    if (v !== undefined) {
      result[key] = v
    }
  }
  ancestors.delete(obj)
  return result
}
