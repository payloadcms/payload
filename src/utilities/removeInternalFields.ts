const internalFields = ['_id', '__v', 'salt', 'hash'];

const traverseData = (data) => {
  if (Array.isArray(data)) return data.map((item) => traverseData(item));
  if (data === null) return data;
  if (data instanceof Date) return data;
  if (typeof data === 'object') {
    return Object.entries(data).reduce((newDoc, [key, val]) => {
      if (key === '_id') {
        return { ...newDoc, id: val };
      }
      if (internalFields.indexOf(key) > -1) {
        return newDoc;
      }

      return {
        ...newDoc,
        [key]: traverseData(val),
      };
    }, {});
  }
  return data;
};

const removeInternalFields = (incomingDoc: unknown) => traverseData(incomingDoc);

export default removeInternalFields;
