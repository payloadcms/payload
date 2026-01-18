import { APIError } from './APIError.js';
export class InvalidFieldName extends APIError {
    constructor(field, fieldName){
        super(`Field ${field.label} has invalid name '${fieldName}'. Field names can not include periods (.) and must be alphanumeric.`);
    }
}

//# sourceMappingURL=InvalidFieldName.js.map