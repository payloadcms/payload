import type { FlattenedField, PayloadRequest } from 'payload';
import type { FromCSVFunction } from '../types.js';
type UnflattenArgs = {
    data: Record<string, unknown>;
    fields: FlattenedField[];
    fromCSVFunctions?: Record<string, FromCSVFunction>;
    req: PayloadRequest;
};
export declare const unflattenObject: ({ data, fields, fromCSVFunctions, req, }: UnflattenArgs) => Record<string, unknown>;
export {};
//# sourceMappingURL=unflattenObject.d.ts.map