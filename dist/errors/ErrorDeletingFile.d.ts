import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class ErrorDeletingFile extends APIError {
    constructor(t?: TFunction);
}
export default ErrorDeletingFile;
