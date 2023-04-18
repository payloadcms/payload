import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class UnauthorizedError extends APIError {
    constructor(t?: TFunction);
}
export default UnauthorizedError;
