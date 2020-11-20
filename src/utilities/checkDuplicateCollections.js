const { DuplicateCollection } = require('../errors');

const getDuplicates = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);

const checkDuplicateCollections = (collections) => {
  const duplicateSlugs = getDuplicates(collections.map((c) => c.slug));
  if (duplicateSlugs.length > 0) {
    throw new DuplicateCollection('slug', duplicateSlugs);
  }
  const duplicateLabels = getDuplicates(collections.map((c) => c.labels.singular));
  if (duplicateLabels.length > 0) {
    throw new DuplicateCollection('label', duplicateLabels);
  }
};

module.exports = checkDuplicateCollections;
