export const flattenObject = (obj: any, prefix: string = ''): Record<string, unknown> => {
  const result: Record<string, unknown> = {}

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}_${key}` : key

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.assign(result, flattenObject(item, `${newKey}_${index}`))
        } else {
          result[`${newKey}_${index}`] = item
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value, newKey))
    } else {
      result[newKey] = value
    }
  })

  return result
}
