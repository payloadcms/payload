const errors = require('../errors');

const { DuplicateCollection, MissingCollectionLabel } = errors;

module.exports = function validateCollection(collection, collections) {
  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  if (collections && collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }
};
