import { APIError } from './APIError.js';
export class DuplicateGlobal extends APIError {
    constructor(config){
        super(`Global label "${config.label}" is already in use`);
    }
}

//# sourceMappingURL=DuplicateGlobal.js.map