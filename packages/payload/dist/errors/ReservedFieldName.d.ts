import type { FieldAffectingData } from '../fields/config/types.js';
import { APIError } from './APIError.js';
export declare class ReservedFieldName extends APIError {
    constructor(field: FieldAffectingData, fieldName: string);
}
//# sourceMappingURL=ReservedFieldName.d.ts.map