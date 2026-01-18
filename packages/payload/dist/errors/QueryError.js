import { status as httpStatus } from 'http-status';
import { APIError } from './APIError.js';
export class QueryError extends APIError {
    constructor(results){
        const message = `The following path${results.length === 1 ? '' : 's'} cannot be queried:`;
        super(`${message} ${results.map((err)=>err.path).join(', ')}`, httpStatus.BAD_REQUEST, results);
    }
}

//# sourceMappingURL=QueryError.js.map