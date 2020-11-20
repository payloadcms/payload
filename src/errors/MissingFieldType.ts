import APIError from './APIError';

class MissingFieldType extends APIError {
  constructor(field) {
    super(`Field "${field.name}" is either missing a field type or it does not match an available field type`);
  }
}

module.exports = MissingFieldType;
