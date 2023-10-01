export function cloneDeep<T>(object: T): T {
  if (object === null) return null

  // Handle Date
  if (object instanceof Date) {
    return new Date(object.getTime()) as unknown as T
  }

  // Handle RegExp
  if (object instanceof RegExp) {
    return new RegExp(object.source, object.flags) as unknown as T
  }

  // Handle Array
  if (Array.isArray(object)) {
    return object.map((item) => cloneDeep(item)) as unknown as T
  }

  // Handle plain Object
  if (typeof object === 'object' && object !== null) {
    const clonedObject: any = {}
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        clonedObject[key] = cloneDeep(object[key])
      }
    }
    return clonedObject as T
  }

  // Handle all other cases
  return object
}
