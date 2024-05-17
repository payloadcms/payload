/**
 * obj2 has priority over obj1
 *
 * Merges obj2 into obj1. Does not handle arrays
 */
export function deepMerge(obj1: any, obj2: any, doNotMergeInNulls = true) {
  const output = { ...obj1 }

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (doNotMergeInNulls) {
        if (
          (obj2[key] === null || obj2[key] === undefined) &&
          obj1[key] !== null &&
          obj1[key] !== undefined
        ) {
          continue
        }
      }

      if (typeof obj2[key] === 'object' && obj1[key]) {
        // Existing behavior for objects
        output[key] = deepMerge(obj1[key], obj2[key], doNotMergeInNulls)
      } else {
        // Direct assignment for values
        output[key] = obj2[key]
      }
    }
  }

  return output
}
