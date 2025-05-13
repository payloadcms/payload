const sanitizeInternalFields = <T extends Record<string, unknown>>(incomingDoc: T): T => {
  // Create a new object to hold the sanitized fields
  const newDoc: Record<string, unknown> = {}

  for (const key in incomingDoc) {
    const val = incomingDoc[key]
    if (key === '_id') {
      newDoc['id'] = val
    } else if (key !== '__v') {
      newDoc[key] = val
    }
  }

  return newDoc as T
}

export default sanitizeInternalFields
