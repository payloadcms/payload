const internalFields = ['__v']

const sanitizeInternalFields = <T extends Record<string, unknown>>(incomingDoc: T): T => {
  const id = incomingDoc._id ? JSON.parse(JSON.stringify(incomingDoc._id)) : incomingDoc.id

  return Object.entries(incomingDoc).reduce((newDoc, [key, val]): T => {
    if (key === '_id' || key === 'id') {
      return {
        ...newDoc,
        id,
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
}

export default sanitizeInternalFields
