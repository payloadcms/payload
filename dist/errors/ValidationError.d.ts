import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class ValidationError extends APIError {
    constructor(results: {
        message: string;
        field: string;
    }[], t?: TFunction);
}
export default ValidationError;
