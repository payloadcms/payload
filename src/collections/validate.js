const errors = require('../errors');

const { DuplicateCollection, MissingCollectionLabel, MissingUseAsTitle } = errors;

module.exports = function validateCollection(collection, collections) {
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
};
