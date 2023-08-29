import { RadioField, SelectField } from '../fields/config/types.js';
import APIError from './APIError.js';

class MissingFieldInputOptions extends APIError {
  constructor(field: SelectField | RadioField) {
    super(`Field ${field.label} is missing options.`);
  }
}

export default MissingFieldInputOptions;
