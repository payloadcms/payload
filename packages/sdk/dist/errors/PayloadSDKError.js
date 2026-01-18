/**
 * Error class for SDK API errors.
 * Contains the HTTP status code and error details from the API response.
 */ export class PayloadSDKError extends Error {
    /**
   * The error data from the API response.
   * For ValidationError, this contains `collection`, `global`, and `errors` array.
   */ errors;
    /** The response object */ response;
    /** HTTP status code */ status;
    constructor({ errors, message, response, status }){
        super(message);
        this.name = 'PayloadSDKError';
        this.status = status;
        this.errors = errors;
        this.response = response;
    }
}

//# sourceMappingURL=PayloadSDKError.js.map