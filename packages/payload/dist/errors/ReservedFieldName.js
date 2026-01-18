import { APIError } from './APIError.js';
export class ReservedFieldName extends APIError {
    constructor(field, fieldName){
        super(`Field ${field.label} has reserved name '${fieldName}'.`);
    }
}

//# sourceMappingURL=ReservedFieldName.js.map