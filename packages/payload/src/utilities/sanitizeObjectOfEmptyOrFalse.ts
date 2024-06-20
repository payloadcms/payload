/**
 * Recursively remove empty objects and false values from an object.
 */
export function sanitizeObjectOfEmptyOrFalse<T>(data: T): T {
  let hasEmptyObjects = true

  while (hasEmptyObjects) {
    hasEmptyObjects = false

    for (const key in data) {
      if (data[key] && typeof data[key] === 'object') {
        sanitizeObjectOfEmptyOrFalse(data[key])
        if (Object.keys(data[key]).length === 0) {
          delete data[key]
          hasEmptyObjects = true
        }
      } else if (data[key] === false || data[key] === undefined) {
        delete data[key]
      }
    }
  }

  return data
}
