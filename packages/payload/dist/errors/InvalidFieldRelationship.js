import { APIError } from './APIError.js';
export class InvalidFieldRelationship extends APIError {
    constructor(field, relationship){
        super(`Field ${field.label} has invalid relationship '${relationship}'.`);
    }
}

//# sourceMappingURL=InvalidFieldRelationship.js.map