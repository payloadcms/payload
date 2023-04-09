import type { TFunction } from 'i18next';
import APIError from './APIError';
declare class MissingFile extends APIError {
    constructor(t?: TFunction);
}
export default MissingFile;
