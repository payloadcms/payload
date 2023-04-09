import APIError from './APIError';
declare class InvalidSchema extends APIError {
    constructor(message: string, results: any);
}
export default InvalidSchema;
