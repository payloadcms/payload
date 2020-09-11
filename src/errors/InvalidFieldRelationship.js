const APIError = require('./APIError');

class InvalidFieldRelationship extends APIError {
  constructor(field, relationship) {
    super(`Field ${field.label} has invalid relationship '${relationship}'.`);
  }
}

module.exports = InvalidFieldRelationship;
