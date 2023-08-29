import { RelationshipField, UploadField } from '../fields/config/types.js';
import APIError from './APIError.js';

class InvalidFieldRelationship extends APIError {
  constructor(field: RelationshipField | UploadField, relationship: string) {
    super(`Field ${field.label} has invalid relationship '${relationship}'.`);
  }
}

export default InvalidFieldRelationship;
