import type { RelationshipField, UploadField } from '../fields/config/types.js';
import { APIError } from './APIError.js';
export declare class InvalidFieldRelationship extends APIError {
    constructor(field: RelationshipField | UploadField, relationship: string);
}
//# sourceMappingURL=InvalidFieldRelationship.d.ts.map