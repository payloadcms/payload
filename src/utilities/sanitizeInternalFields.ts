const internalFields = ['__v', 'salt', 'hash'];

const sanitizeInternalFields = <T extends Record<string, unknown>>(incomingDoc: T): T => Object.entries(incomingDoc).reduce((newDoc, [key, val]): T => {
  if (key === '_id') {
    return {
      ...newDoc,
      id: val,
    };
  }

  if (internalFields.indexOf(key) > -1) {
    return newDoc;
  }

  return {
    ...newDoc,
    [key]: val,
  };
}, {} as T);

export default sanitizeInternalFields;
