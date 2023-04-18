import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class AuthenticationError extends APIError {
    constructor(t?: TFunction);
}
export default AuthenticationError;
