import APIError from './APIError';
declare class DuplicateCollection extends APIError {
    constructor(propertyName: string, duplicates: string[]);
}
export default DuplicateCollection;
