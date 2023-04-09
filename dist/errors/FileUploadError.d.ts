import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class FileUploadError extends APIError {
    constructor(t?: TFunction);
}
export default FileUploadError;
