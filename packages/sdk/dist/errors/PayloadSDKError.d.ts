import type { ErrorResult } from 'payload';
/**
 * Error class for SDK API errors.
 * Contains the HTTP status code and error details from the API response.
 */
export declare class PayloadSDKError extends Error {
    /**
     * The error data from the API response.
     * For ValidationError, this contains `collection`, `global`, and `errors` array.
     */
    errors: ErrorResult['errors'];
    /** The response object */
    response: Response;
    /** HTTP status code */
    status: number;
    constructor({ errors, message, response, status, }: {
        errors: ErrorResult['errors'];
        message: string;
        response: Response;
        status: number;
    });
}
//# sourceMappingURL=PayloadSDKError.d.ts.map