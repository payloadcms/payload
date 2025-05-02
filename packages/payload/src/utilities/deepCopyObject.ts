// @ts-strict-ignore
import type { JsonValue } from '../types/index.js'

/*
Main deepCopyObject handling - from rfdc: https://github.com/davidmarkclements/rfdc/blob/master/index.js

Copyright 2019 "David Mark Clements <david.mark.clements@gmail.com>"

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

function copyBuffer(cur) {
  if (cur instanceof Buffer) {
    return Buffer.from(cur)
  }

  return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length)
}

const constructorHandlers = new Map()
constructorHandlers.set(Date, (o) => new Date(o))
constructorHandlers.set(Map, (o, fn) => new Map(cloneArray<any>(Array.from(o), fn)))
constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)))
constructorHandlers.set(RegExp, (regex: RegExp) => new RegExp(regex.source, regex.flags))

let handler = null

function cloneArray<T>(a: T, fn): T {
  const keys = Object.keys(a)
  const a2 = new Array(keys.length)
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    const cur = a[k]
    if (typeof cur !== 'object' || cur === null) {
      a2[k] = cur
    } else if (cur instanceof RegExp) {
      a2[k] = new RegExp(cur.source, cur.flags)
    } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
      a2[k] = handler(cur, fn)
    } else if (ArrayBuffer.isView(cur)) {
      a2[k] = copyBuffer(cur)
    } else {
      a2[k] = fn(cur)
    }
  }
  return a2 as T
}

export const deepCopyObject = <T>(o: T): T => {
  if (typeof o !== 'object' || o === null) {
    return o
  }
  if (Array.isArray(o)) {
    return cloneArray(o, deepCopyObject)
  }
  if (o instanceof RegExp) {
    return new RegExp(o.source, o.flags) as T
  }

  if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
    return handler(o, deepCopyObject)
  }
  const o2 = {}
  for (const k in o) {
    if (Object.hasOwnProperty.call(o, k) === false) {
      continue
    }
    const cur = o[k]
    if (typeof cur !== 'object' || cur === null) {
      o2[k as string] = cur
    } else if (cur instanceof RegExp) {
      o2[k as string] = new RegExp(cur.source, cur.flags)
    } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
      o2[k as string] = handler(cur, deepCopyObject)
    } else if (ArrayBuffer.isView(cur)) {
      o2[k as string] = copyBuffer(cur)
    } else {
      o2[k as string] = deepCopyObject(cur)
    }
  }
  return o2 as T
}

/*
Fast deepCopyObjectSimple handling - from fast-json-clone: https://github.com/rhysd/fast-json-clone

Benchmark: https://github.com/AlessioGr/fastest-deep-clone-json/blob/main/test/benchmark.js
*/

/**
 * A deepCopyObject implementation which only works for JSON objects and arrays, and is faster than
 * JSON.parse(JSON.stringify(obj))
 *
 * @param value The JSON value to be cloned. There are two invariants. 1) It must not contain circles
 *              as JSON does not allow it. This function will cause infinite loop for such values by
 *              design. 2) It must contain JSON values only. Other values like `Date`, `Regexp`, `Map`,
 *              `Set`, `Buffer`, ... are not allowed.
 * @returns The cloned JSON value.
 */
export function deepCopyObjectSimple<T extends JsonValue>(value: T, filterUndefined = false): T {
  if (typeof value !== 'object' || value === null) {
    return value
  } else if (Array.isArray(value)) {
    return value.map((e) =>
      typeof e !== 'object' || e === null ? e : deepCopyObjectSimple(e, filterUndefined),
    ) as T
  } else {
    if (value instanceof Date) {
      return new Date(value) as unknown as T
    }
    const ret: { [key: string]: T } = {}
    for (const k in value) {
      const v = value[k]
      if (filterUndefined && v === undefined) {
        continue
      }
      ret[k] =
        typeof v !== 'object' || v === null
          ? v
          : (deepCopyObjectSimple(v as T, filterUndefined) as any)
    }
    return ret as unknown as T
  }
}

export function deepCopyObjectSimpleWithoutReactComponents<T extends JsonValue>(value: T): T {
  if (
    typeof value === 'object' &&
    value !== null &&
    '$$typeof' in value &&
    typeof value.$$typeof === 'symbol'
  ) {
    return undefined
  } else if (typeof value !== 'object' || value === null) {
    return value
  } else if (Array.isArray(value)) {
    return value.map((e) =>
      typeof e !== 'object' || e === null ? e : deepCopyObjectSimpleWithoutReactComponents(e),
    ) as T
  } else {
    if (value instanceof Date) {
      return new Date(value) as unknown as T
    }
    const ret: { [key: string]: T } = {}
    for (const k in value) {
      const v = value[k]
      ret[k] =
        typeof v !== 'object' || v === null
          ? v
          : (deepCopyObjectSimpleWithoutReactComponents(v as T) as any)
    }
    return ret as unknown as T
  }
}

/**
 * A deepCopyObject implementation which is slower than deepCopyObject, but more correct.
 * Can be used if correctness is more important than speed. Supports circular dependencies
 */
export function deepCopyObjectComplex<T>(object: T, cache: WeakMap<any, any> = new WeakMap()): T {
  if (object === null) {
    return null
  }

  if (cache.has(object)) {
    return cache.get(object)
  }

  // Handle File
  if (object instanceof File) {
    return object as unknown as T
  }

  // Handle Date
  if (object instanceof Date) {
    return new Date(object.getTime()) as unknown as T
  }

  // Handle RegExp
  if (object instanceof RegExp) {
    return new RegExp(object.source, object.flags) as unknown as T
  }

  // Handle Map
  if (object instanceof Map) {
    const clonedMap = new Map()
    cache.set(object, clonedMap)
    for (const [key, value] of object.entries()) {
      clonedMap.set(key, deepCopyObjectComplex(value, cache))
    }
    return clonedMap as unknown as T
  }

  // Handle Set
  if (object instanceof Set) {
    const clonedSet = new Set()
    cache.set(object, clonedSet)
    for (const value of object.values()) {
      clonedSet.add(deepCopyObjectComplex(value, cache))
    }
    return clonedSet as unknown as T
  }

  // Handle Array and Object
  if (typeof object === 'object' && object !== null) {
    if ('$$typeof' in object && typeof object.$$typeof === 'symbol') {
      return object
    }

    const clonedObject: any = Array.isArray(object)
      ? []
      : Object.create(Object.getPrototypeOf(object))
    cache.set(object, clonedObject)

    for (const key in object) {
      if (
        Object.prototype.hasOwnProperty.call(object, key) ||
        Object.getOwnPropertySymbols(object).includes(key as any)
      ) {
        clonedObject[key] = deepCopyObjectComplex(object[key], cache)
      }
    }

    return clonedObject as T
  }

  // Handle all other cases
  return object
}
