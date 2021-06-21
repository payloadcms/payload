const internalFields = ['__v', 'salt', 'hash'];

const sanitizeInternalFields = (incomingDoc) => Object.entries(incomingDoc).reduce((newDoc, [key, val]) => {
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
}, {});

export default sanitizeInternalFields;
