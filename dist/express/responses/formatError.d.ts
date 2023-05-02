import APIError from '../../errors/APIError';
export type ErrorResponse = {
    errors: unknown[];
    data?: any;
    stack?: string;
};
declare const formatErrorResponse: (incoming: Error | APIError | {
    [key: string]: unknown;
}) => ErrorResponse;
export default formatErrorResponse;
