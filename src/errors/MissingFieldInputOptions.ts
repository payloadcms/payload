import APIError from './APIError';

class MissingFieldInputOptions extends APIError {
  constructor(field) {
    super(`Field ${field.label} is missing options.`);
  }
}

export default MissingFieldInputOptions;
