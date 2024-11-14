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

export function deepMerge<T = object>(obj1: any, obj2: any): T {
  const output = Array.isArray(obj1) ? [...obj1] : { ...obj1 }

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      const val1 = obj1[key]
      const val2 = obj2[key]

      if (Array.isArray(val1) && Array.isArray(val2)) {
        output[key] = [...val1, ...val2]
      } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 && val2) {
        output[key] = deepMerge(val1, val2)
      } else {
        output[key] = val2
      }
    }
  }

  return output as T
}
