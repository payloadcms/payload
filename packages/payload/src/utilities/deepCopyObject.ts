import type { JsonArray, JsonObject, JsonValue } from '../types/index.js'

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
 * JSON.parse(JSON.stringify(obj)): https://github.com/rhysd/fast-json-clone
 *
 * Benchmark: https://github.com/AlessioGr/fastest-deep-clone-json/blob/main/test/benchmark.js
 *
 * @param value The JSON value to be cloned. There are two invariants. 1) It must not contain circles
 *              as JSON does not allow it. This function will cause infinite loop for such values by
 *              design. 2) It must contain JSON values only. Other values like `Date`, `Regexp`, `Map`,
 *              `Set`, `Buffer`, ... are not allowed.
 * @returns The cloned JSON value.
 */
export function deepCopyObjectSimple(value: JsonValue): JsonValue {
  if (typeof value !== 'object' || value === null) {
    return value
  } else if (Array.isArray(value)) {
    return value.map((e) => (typeof e !== 'object' || e === null ? e : deepCopyObjectSimple(e)))
  } else {
    const ret: { [key: string]: JsonValue } = {}
    for (const k in value) {
      const v = value[k]
      ret[k] = typeof v !== 'object' || v === null ? v : deepCopyObjectSimple(v)
    }
    return ret
  }
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
