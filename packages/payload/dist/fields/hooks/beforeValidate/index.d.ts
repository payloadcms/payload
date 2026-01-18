import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import type { JsonObject, PayloadRequest } from '../../../types/index.js';
import { type RequestContext } from '../../../index.js';
type Args<T extends JsonObject> = {
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    data: T;
    doc?: T;
    duplicate?: boolean;
    global: null | SanitizedGlobalConfig;
    id?: number | string;
    operation: 'create' | 'update';
    overrideAccess: boolean;
    req: PayloadRequest;
};
/**
 * This function is responsible for the following actions, in order:
 * - Sanitize incoming data
 * - Execute field hooks
 * - Execute field access control
 * - Merge original document data into incoming data
 * - Compute default values for undefined fields
 */
export declare const beforeValidate: <T extends JsonObject>({ id, collection, context, data: incomingData, doc, global, operation, overrideAccess, req, }: Args<T>) => Promise<T>;
export {};
//# sourceMappingURL=index.d.ts.map