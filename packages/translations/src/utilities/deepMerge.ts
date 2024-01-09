export function deepMerge(obj1, obj2) {
  const output = { ...obj1 }

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key]) && obj1[key]) {
        output[key] = deepMerge(obj1[key], obj2[key])
      } else {
        output[key] = obj2[key]
      }
    }
  }

  return output
}
