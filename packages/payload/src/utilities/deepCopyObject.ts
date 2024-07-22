import type { JsonArray, JsonObject } from '../types/index.js'

export const deepCopyObject = (inObject) => {
  if (inObject instanceof Date) return inObject

  if (inObject instanceof Set) return new Set(inObject)

  if (inObject instanceof Map) return new Map(inObject)

  if (typeof inObject !== 'object' || inObject === null) {
    return inObject // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  const outObject = Array.isArray(inObject) ? [] : {}

  Object.keys(inObject).forEach((key) => {
    const value = inObject[key]

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = typeof value === 'object' && value !== null ? deepCopyObject(value) : value
  })

  return outObject
}

/**
 * A deepCopyObject implementation which only works for JSON objects and arrays, and is faster than
 * JSON.parse(JSON.stringify(obj)): https://github.com/benjamine/jsondiffpatch/blob/master/packages/jsondiffpatch/src/clone.ts
 *
 * Benchmark: https://github.com/AlessioGr/fastest-deep-clone-json/blob/main/test/benchmark.js
 *
 * License:
 * The MIT License
 *
 * Copyright (c) 2018 Benjamin Eidelman, https://twitter.com/beneidel
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
export const deepCopyObjectSimple = <T extends JsonObject>(arg: T): T => {
  if (typeof arg !== 'object') {
    return arg
  }
  if (arg === null) {
    return null
  }
  if (Array.isArray(arg)) {
    return arg.map(deepCopyObjectSimple) as any
  }

  const cloned: T = {} as T
  for (const name in arg) {
    if (Object.prototype.hasOwnProperty.call(arg, name)) {
      ;(cloned as Record<string, unknown>)[name] = deepCopyObjectSimple(arg[name] as JsonObject)
    }
  }
  return cloned
}

/**
 * A deepCopyObject implementation which is slower than deepCopyObject, but more correct.
 * Can be used if correctness is more important than speed.
 */
export function deepCopyObjectComplex<T>(object: T, cache: WeakMap<any, any> = new WeakMap()): T {
  if (object === null) return null

  if (cache.has(object)) {
    return cache.get(object)
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
