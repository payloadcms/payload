/**
 * @extends Error
 */
declare class ExtendableError extends Error {
    status: number;
    data: {
        [key: string]: unknown;
    };
    isPublic: boolean;
    isOperational: boolean;
    constructor(message: string, status: number, data: {
        [key: string]: unknown;
    }, isPublic: boolean);
}
/**
 * Class representing an API error.
 * @extends ExtendableError
 */
declare class APIError extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {object} data - response data to be returned.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     */
    constructor(message: string, status?: number, data?: any, isPublic?: boolean);
}
export default APIError;
