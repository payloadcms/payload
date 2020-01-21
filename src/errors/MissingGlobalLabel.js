const APIError = require('./APIError');

class MissingGlobalLabel extends APIError {
  constructor(config) {
    super(`${config.globals} object is missing label`);
  }
}

module.exports = MissingGlobalLabel;
