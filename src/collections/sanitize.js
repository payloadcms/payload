const { DuplicateCollection, MissingCollectionLabel, MissingUseAsTitle } = require('../errors');
const sanitizeFields = require('../fields/sanitize');

const sanitizeCollection = (collections, collection) => {
  // /////////////////////////////////
  // Ensure collection is valid
  // /////////////////////////////////

  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  const { useAsTitle } = collection;
  const fieldToUseAsTitle = collection.fields.find(field => useAsTitle === field.name);

  if (!fieldToUseAsTitle) {
    throw new MissingUseAsTitle(collection);
  }

  if (collections && collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }


  const sanitizedCollectionConfig = { ...collection };

  sanitizedCollectionConfig.fields = sanitizeFields(collection.fields);

  return sanitizedCollectionConfig;
};

module.exports = sanitizeCollection;
