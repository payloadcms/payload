import type { FieldAffectingData } from '../fields/config/types.js';
import { APIError } from './APIError.js';
export declare class InvalidFieldName extends APIError {
    constructor(field: FieldAffectingData, fieldName: string);
}
//# sourceMappingURL=InvalidFieldName.d.ts.map