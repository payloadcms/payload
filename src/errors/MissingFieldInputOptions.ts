import { Field } from '../fields/config/types';
import APIError from './APIError';

class MissingFieldInputOptions extends APIError {
  constructor(field: Field) {
    super(`Field ${field.label} is missing options.`);
  }
}

export default MissingFieldInputOptions;
