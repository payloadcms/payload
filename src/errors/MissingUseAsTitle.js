const APIError = require('./APIError');

class MissingUseAsTitle extends APIError {
  constructor(collection) {
    super(`${collection.labels.singular} collection is missing a useAsTitle property.`);
  }
}

module.exports = MissingCollectionLabel;
