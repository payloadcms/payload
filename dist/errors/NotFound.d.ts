import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class NotFound extends APIError {
    constructor(t?: TFunction);
}
export default NotFound;
