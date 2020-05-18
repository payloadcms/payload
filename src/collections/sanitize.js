const { DuplicateCollection, MissingCollectionLabel } = require('../errors');
const sanitizeFields = require('../fields/sanitize');
const toKebabCase = require('../utilities/toKebabCase');

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

  sanitizedCollectionConfig.slug = toKebabCase(sanitizedCollectionConfig.slug);

  // /////////////////////////////////
  // Ensure that collection has required object structure
  // /////////////////////////////////

  if (!sanitizedCollectionConfig.hooks) sanitizedCollectionConfig.hooks = {};
  if (!sanitizedCollectionConfig.policies) sanitizedCollectionConfig.policies = {};

  if (sanitizedCollectionConfig.upload) {
    if (!sanitizedCollectionConfig.upload.staticDir) sanitizedCollectionConfig.upload.staticDir = '/static';
    if (!sanitizedCollectionConfig.upload.staticURL) sanitizedCollectionConfig.upload.staticURL = '/static';
  }

  // /////////////////////////////////
  // Sanitize fields
  // /////////////////////////////////

  sanitizedCollectionConfig.fields = sanitizeFields(collection.fields);

  return sanitizedCollectionConfig;
};

module.exports = sanitizeCollection;
