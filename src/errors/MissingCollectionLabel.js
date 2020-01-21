const APIError = require('./APIError');

class MissingCollectionLabel extends APIError {
  constructor() {
    super('payload.config.collection object is missing label');
  }
}

module.exports = MissingCollectionLabel;
