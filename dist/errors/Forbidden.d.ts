import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class Forbidden extends APIError {
    constructor(t?: TFunction);
}
export default Forbidden;
