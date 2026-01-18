import type { TFunction } from '@payloadcms/translations';
import type { LabelFunction, StaticLabel } from '../config/types.js';
import type { PayloadRequest } from '../types/index.js';
import { APIError } from './APIError.js';
export declare let ValidationErrorName: string;
export type ValidationFieldError = {
    label?: LabelFunction | StaticLabel;
    message: string;
    path: string;
};
export declare class ValidationError extends APIError<{
    collection?: string;
    errors: ValidationFieldError[];
    global?: string;
}> {
    constructor(results: {
        collection?: string;
        errors: ValidationFieldError[];
        global?: string;
        id?: number | string;
        /**
         *  req needs to be passed through (if you have one) in order to resolve label functions that may be part of the errors array
         */
        req?: Partial<PayloadRequest>;
    }, t?: TFunction);
}
//# sourceMappingURL=ValidationError.d.ts.map