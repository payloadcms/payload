const internalFields = ['_id', '__v', 'salt', 'hash', '_verificationToken'];

const removeInternalFields = (incomingDoc) => Object.entries(incomingDoc).reduce((newDoc, [key, val]) => {
  if (internalFields.indexOf(key) > -1) {
    return newDoc;
  }

  return {
    ...newDoc,
    [key]: val,
  };
}, {});

export default removeInternalFields;
