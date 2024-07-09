/**
 * obj2 has priority over obj1
 *
 * Merges obj2 into obj1
 */
export function _deepMerge(obj1, obj2, doNotMergeInNulls = true) {
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

      // Check if both are arrays
      if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
        // Merge each element in the arrays

        // We need the Array.from, map rather than a normal map because this handles holes in arrays properly. A simple .map would skip holes.
        output[key] = Array.from(obj2[key], (item, index) => {
          if (doNotMergeInNulls) {
            if (
              (item === undefined || item === null) &&
              obj1[key][index] !== null &&
              obj1[key][index] !== undefined
            ) {
              return obj1[key][index]
            }
          }

          if (typeof item === 'object' && !Array.isArray(item) && obj1[key][index]) {
            // Deep merge for objects in arrays
            return deepMerge(obj1[key][index], item, doNotMergeInNulls)
          }
          return item
        })
      } else if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key]) && obj1[key]) {
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

export function deepMerge(...objs) {
  return objs.reduce((acc, obj) => _deepMerge(acc, obj), {})
}
