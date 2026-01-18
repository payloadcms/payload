import { APIError } from './APIError.js';
export class InvalidFieldJoin extends APIError {
    constructor(field){
        super(`Invalid join field ${field.name}. The config does not have a field '${field.on}' in collection '${field.collection}'.`);
    }
}

//# sourceMappingURL=InvalidFieldJoin.js.map