const APIError = require('./APIError');

class MissingSelectOptions extends APIError {
  constructor(field) {
    super(`Field ${field.label} is missing options.`);
  }
}

module.exports = MissingSelectOptions;
