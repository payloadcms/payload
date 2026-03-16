/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export const isObject = (item: unknown): item is Record<string, unknown> => {
  return typeof item === 'object' && !Array.isArray(item) && item !== null
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export const deepMerge = <T, R>(target: T, source: R): T => {
  const output = { ...target } as Record<string, unknown>
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key]
        } else {
          output[key] = deepMerge((target as Record<string, unknown>)[key], source[key])
        }
      } else {
        output[key] = source[key]
      }
    })
  }

  return output as T
}
