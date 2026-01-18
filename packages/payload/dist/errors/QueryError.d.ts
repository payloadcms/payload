import { APIError } from './APIError.js';
export declare class QueryError extends APIError<{
    path: string;
}[]> {
    constructor(results: {
        path: string;
    }[]);
}
//# sourceMappingURL=QueryError.d.ts.map