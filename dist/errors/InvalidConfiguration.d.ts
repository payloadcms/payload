import APIError from './APIError';
declare class InvalidConfiguration extends APIError {
    constructor(message: string);
}
export default InvalidConfiguration;
