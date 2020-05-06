const { DuplicateCollection, MissingCollectionLabel, MissingUseAsTitle } = require('../errors');
const sanitizeFields = require('../fields/sanitize');

const sanitizeCollection = (collections, collection) => {
  // /////////////////////////////////
  // Ensure collection is valid
  // /////////////////////////////////

  if (!collection.labels.singular) {
    throw new MissingCollectionLabel(collection);
  }

  if (collections && collections[collection.labels.singular]) {
    throw new DuplicateCollection(collection);
  }

  // /////////////////////////////////
  // Make copy of collection config
  // /////////////////////////////////

  const sanitizedCollectionConfig = { ...collection };

  // /////////////////////////////////
  // Ensure that collection has required object structure
  // /////////////////////////////////

  if (!sanitizedCollectionConfig.hooks) sanitizedCollectionConfig.hooks = {};
  if (!sanitizedCollectionConfig.policies) sanitizedCollectionConfig.policies = {};

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  sanitizedCollectionConfig.fields = sanitizeFields(collection.fields);

  return sanitizedCollectionConfig;
};

module.exports = sanitizeCollection;
