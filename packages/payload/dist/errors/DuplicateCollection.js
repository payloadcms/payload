import { APIError } from './APIError.js';
export class DuplicateCollection extends APIError {
    constructor(propertyName, duplicate){
        super(`Collection ${propertyName} already in use: "${duplicate}"`);
    }
}

//# sourceMappingURL=DuplicateCollection.js.map