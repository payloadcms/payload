export const findValueInDoc = (doc: Record<string, any>, targetName: string): any => {
  if (!doc || typeof doc !== 'object') {
    return undefined
  }

  if (targetName in doc) {
    return doc[targetName]
  }

  for (const key in doc) {
    if (typeof doc[key] === 'object' && doc[key] !== null) {
      const result = findValueInDoc(doc[key], targetName)
      if (result !== undefined) {
        return result
      }
    }
  }

  return undefined
}
