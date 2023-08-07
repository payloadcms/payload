import { RadioField, SelectField } from '../fields/config/types';
import APIError from './APIError';

class MissingFieldInputOptions extends APIError {
  constructor(field: SelectField | RadioField) {
    super(`Field ${field.label} is missing options.`);
  }
}

export default MissingFieldInputOptions;
