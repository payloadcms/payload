/**
 * Very simple, but fast deepMerge implementation. Only deepMerges objects, not arrays and clones everything.
 * Do not use this if your object contains any complex objects like React Components, or if you would like to combine Arrays.
 * If you only have simple objects and need a fast deepMerge, this is the function for you.
 *
 * obj2 takes precedence over obj1 - thus if obj2 has a key that obj1 also has, obj2's value will be used.
 *
 * @param obj1 base object
 * @param obj2 object to merge "into" obj1
 */
export function deepMergeSimple<T = object>(obj1: object, obj2: object): T {
  const output = { ...obj1 }

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key]) && obj1[key]) {
        output[key] = deepMergeSimple(obj1[key], obj2[key])
      } else {
        output[key] = obj2[key]
      }
    }
  }

  return output as T
}

/**
 * Deep merge two objects. Arrays are concatenated, objects are merged recursively.
 *
 * @param obj1 base object
 * @param obj2 object to merge "into" obj1
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
