import type React from 'react'

import { renderServerComponent } from '@tanstack/react-start/rsc'
import { setOwnProperty } from 'payload/shared'
import { createElement, Fragment } from 'react'

/** Converts raw React elements in a server-function result into RSC handles. */
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

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined
  }

  if (typeof value !== 'object') {
    return value
  }

  const obj = value as Record<string, unknown>

  if (isReactElement(obj)) {
    return await renderServerComponent(value as React.ReactElement)
  }

  if (obj instanceof Date) {
    return obj.constructor === Date ? value : new Date(obj.getTime())
  }

  if (obj instanceof RegExp || ArrayBuffer.isView(obj)) {
    return value
  }

  if (ancestors.has(obj)) {
    return undefined
  }

  if (cache.has(obj)) {
    return cache.get(obj)
  }

  ancestors.add(obj)

  if (Array.isArray(obj)) {
    const items = obj.filter((item) => item !== null && item !== undefined)
    const isReactElementArray = items.length > 0 && items.every(isReactElement)

    if (isReactElementArray) {
      ancestors.delete(obj)
      return await renderServerComponent(
        createElement(Fragment, null, ...(obj as React.ReactNode[])),
      )
    }

    const result: unknown[] = []
    cache.set(obj, result)

    for (const item of obj) {
      result.push(await walk(item, cache, ancestors))
    }

    ancestors.delete(obj)
    return result
  }

  if (obj instanceof Map) {
    const result = new Map()
    cache.set(obj, result)

    for (const [key, item] of obj) {
      result.set(key, await walk(item, cache, ancestors))
    }

    ancestors.delete(obj)
    return result
  }

  if (obj instanceof Set) {
    const result = new Set()
    cache.set(obj, result)

    for (const item of obj) {
      result.add(await walk(item, cache, ancestors))
    }

    ancestors.delete(obj)
    return result
  }

  const result: Record<string, unknown> = {}
  cache.set(obj, result)

  for (const key of Object.keys(obj)) {
    const serialized = await walk(obj[key], cache, ancestors)
    if (serialized !== undefined) {
      setOwnProperty({ key, target: result, value: serialized })
    }
  }

  ancestors.delete(obj)
  return result
}

function isReactElement(value: unknown): value is React.ReactElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { $$typeof?: unknown }).$$typeof === 'symbol'
  )
}
