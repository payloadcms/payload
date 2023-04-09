import { RelationshipField, UploadField } from '../fields/config/types';
import APIError from './APIError';
declare class InvalidFieldRelationship extends APIError {
    constructor(field: RelationshipField | UploadField, relationship: string);
}
export default InvalidFieldRelationship;
