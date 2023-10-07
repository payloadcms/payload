export function cloneDeep<T>(object: T, cache: WeakMap<any, any> = new WeakMap()): T {
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
      clonedMap.set(key, cloneDeep(value, cache))
    }
    return clonedMap as unknown as T
  }

  // Handle Set
  if (object instanceof Set) {
    const clonedSet = new Set()
    cache.set(object, clonedSet)
    for (const value of object.values()) {
      clonedSet.add(cloneDeep(value, cache))
    }
    return clonedSet as unknown as T
  }

  // Handle Array and Object
  if (typeof object === 'object' && object !== null) {
    const clonedObject: any = Array.isArray(object)
      ? []
      : Object.create(Object.getPrototypeOf(object))
    cache.set(object, clonedObject)

    for (const key in object) {
      if (object.hasOwnProperty(key) || Object.getOwnPropertySymbols(object).includes(key as any)) {
        clonedObject[key] = cloneDeep(object[key], cache)
      }
    }

    return clonedObject as T
  }

  // Handle all other cases
  return object
}
