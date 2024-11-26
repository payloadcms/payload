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
