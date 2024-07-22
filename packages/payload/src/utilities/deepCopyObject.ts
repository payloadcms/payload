export const deepCopyObject = (inObject) => {
  if (inObject instanceof Date) return inObject

  if (inObject instanceof Set) return new Set(inObject)

  if (inObject instanceof Map) return new Map(inObject)

  if (typeof inObject !== 'object' || inObject === null) {
    return inObject // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  const outObject = Array.isArray(inObject) ? [] : {}

  Object.keys(inObject).forEach((key) => {
    const value = inObject[key]

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = typeof value === 'object' && value !== null ? deepCopyObject(value) : value
  })

  return outObject
}

/**
 * A deepCopyObject implementation which only works for objects and arrays, and is faster than
 * JSON.parse(JSON.stringify(inObject)): https://www.measurethat.net/Benchmarks/Show/31439/0/jsonstringify-vs-structuredclone-vs-simple-deepcopyobje
 *
 * This is not recursive and should thus be more memory efficient, due to less stack frames
 */
export const deepCopyObjectSimple = (inObject) => {
  if (typeof inObject !== 'object' || inObject === null) {
    return inObject
  }

  const stack = [{ source: inObject, target: Array.isArray(inObject) ? [] : {} }]
  const root = stack[0].target

  while (stack.length > 0) {
    const { source, target } = stack.pop()

    for (const key in source) {
      const value = source[key]
      if (typeof value === 'object' && value !== null) {
        target[key] = Array.isArray(value) ? [] : {}
        stack.push({ source: value, target: target[key] })
      } else {
        target[key] = value
      }
    }
  }

  return root
}
