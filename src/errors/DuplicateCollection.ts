const APIError = require('./APIError');

class DuplicateCollection extends APIError {
  constructor(propertyName, duplicates) {
    super(`Collection ${propertyName} already in use: "${duplicates.join(', ')}"`);
  }
}

module.exports = DuplicateCollection;
