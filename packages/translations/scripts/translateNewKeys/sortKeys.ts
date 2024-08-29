export function sortKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys)
  }

  const sortedKeys = Object.keys(obj).sort()
  const sortedObj: { [key: string]: any } = {}

  for (const key of sortedKeys) {
    sortedObj[key] = sortKeys(obj[key])
  }

  return sortedObj
}
