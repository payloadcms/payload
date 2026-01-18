import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import type { RequestContext } from '../../../index.js';
import type { JsonObject, PayloadRequest } from '../../../types/index.js';
type Args<T extends JsonObject> = {
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    /**
     * The data before hooks
     */
    data: T;
    /**
     * The data after hooks
     */
    doc: T;
    global: null | SanitizedGlobalConfig;
    operation: 'create' | 'update';
    previousDoc: T;
    req: PayloadRequest;
};
/**
 * This function is responsible for the following actions, in order:
 * - Execute field hooks
 */
export declare const afterChange: <T extends JsonObject>({ collection, context, data, doc: incomingDoc, global, operation, previousDoc, req, }: Args<T>) => Promise<T>;
export {};
//# sourceMappingURL=index.d.ts.map