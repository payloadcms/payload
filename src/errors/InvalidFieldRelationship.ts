import APIError from './APIError';

class InvalidFieldRelationship extends APIError {
  constructor(field, relationship) {
    super(`Field ${field.label} has invalid relationship '${relationship}'.`);
  }
}

export default InvalidFieldRelationship;
