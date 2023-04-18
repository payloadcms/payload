import { Field } from '../fields/config/types';
import APIError from './APIError';
declare class MissingFieldType extends APIError {
    constructor(field: Field);
}
export default MissingFieldType;
