import { RadioField, SelectField } from '../fields/config/types';
import APIError from './APIError';
declare class MissingFieldInputOptions extends APIError {
    constructor(field: SelectField | RadioField);
}
export default MissingFieldInputOptions;
