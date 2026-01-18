export declare let APIErrorName: string;
declare class ExtendableError<TData extends object = {
    [key: string]: unknown;
}> extends Error {
    data: TData;
    isOperational: boolean;
    isPublic: boolean;
    status: number;
    constructor(message: string, status: number, data: TData, isPublic: boolean);
}
/**
 * Class representing an API error.
 * @extends ExtendableError
 */
export declare class APIError<TData extends null | object = {
    [key: string]: unknown;
} | null> extends ExtendableError<TData> {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {object} data - response data to be returned.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     */
    constructor(message: string, status?: number, data?: TData, isPublic?: boolean);
}
export {};
//# sourceMappingURL=APIError.d.ts.map