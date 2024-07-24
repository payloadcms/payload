const internalFields = ['__v']

const sanitizeInternalFields = <T extends Record<string, unknown>>(incomingDoc: T): T =>
  Object.entries(incomingDoc).reduce((newDoc, [key, val]): T => {
    if (key === '_id' || key === 'id') {
      return {
        ...newDoc,
        id: JSON.parse(JSON.stringify(val)),
      }
    }

    if (internalFields.indexOf(key) > -1) {
      return newDoc
    }

    return {
      ...newDoc,
      [key]: val,
    }
  }, {} as T)

export default sanitizeInternalFields
