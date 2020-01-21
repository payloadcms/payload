const APIError = require('./APIError');

class DuplicateCollection extends APIError {
  constructor(config) {
    super(`Collection name "${config.labels.singular}" is already in use`);
  }
}

module.exports = DuplicateCollection;
