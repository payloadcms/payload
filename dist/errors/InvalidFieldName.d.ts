import { FieldAffectingData } from '../fields/config/types';
import APIError from './APIError';
declare class InvalidFieldName extends APIError {
    constructor(field: FieldAffectingData, fieldName: string);
}
export default InvalidFieldName;
