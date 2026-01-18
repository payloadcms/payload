import { APIError } from './APIError.js';
export class MissingFieldInputOptions extends APIError {
    constructor(field){
        super(`Field ${field.label} is missing options.`);
    }
}

//# sourceMappingURL=MissingFieldInputOptions.js.map