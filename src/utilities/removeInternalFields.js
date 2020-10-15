const removeInternalFields = (incomingDoc) => {
  const doc = { ...incomingDoc };
  if (doc._id) delete doc._id;
  if (doc.__v) delete doc.__v;
  if (doc.salt) delete doc._salt;
  if (doc.hash) delete doc._hash;
  return doc;
};

module.exports = removeInternalFields;
