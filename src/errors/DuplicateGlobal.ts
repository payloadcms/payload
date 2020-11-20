const APIError = require('./APIError');

class DuplicateGlobal extends APIError {
  constructor(config) {
    super(`Global label "${config.label}" is already in use`);
  }
}

module.exports = DuplicateGlobal;
