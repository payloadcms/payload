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
 * A deepCopyObject implementation which only works for objects and arrays, and is faster than
 * JSON.parse(JSON.stringify(inObject)): https://www.measurethat.net/Benchmarks/Show/31442/0/jsonstringify-vs-structuredclone-vs-simple-deepcopyobje
 *
 * This is not recursive and should thus be more memory efficient, due to less stack frames
 */
export const deepCopyObjectSimple = (inObject) => {
  if (typeof inObject !== 'object' || inObject === null) {
    return inObject
  }

  const stack = [{ source: inObject, target: Array.isArray(inObject) ? [] : {} }]
  const root = stack[0].target

  while (stack.length > 0) {
    const { source, target } = stack.pop()

    for (const key in source) {
      const value = source[key]
      if (typeof value === 'object' && value !== null) {
        target[key] = Array.isArray(value) ? [] : {}
        stack.push({ source: value, target: target[key] })
      } else {
        target[key] = value
      }
    }
  }

  return root
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
