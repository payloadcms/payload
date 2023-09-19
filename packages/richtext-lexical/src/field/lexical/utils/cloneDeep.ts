export function cloneDeep<T>(object: T): T {
  if (object === null) return null

  if (Array.isArray(object)) {
    return object.map((item) => cloneDeep(item)) as unknown as T
  }

  if (typeof object === 'object') {
    const clonedObject: any = {}
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        clonedObject[key] = cloneDeep(object[key])
      }
    }
    return clonedObject as T
  }

  return object
}
