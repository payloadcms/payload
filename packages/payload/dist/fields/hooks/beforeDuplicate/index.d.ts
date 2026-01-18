import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { RequestContext } from '../../../index.js';
import type { JsonObject, PayloadRequest } from '../../../types/index.js';
type Args<T extends JsonObject> = {
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    doc?: T;
    id?: number | string;
    overrideAccess: boolean;
    req: PayloadRequest;
};
/**
 * This function is responsible for running beforeDuplicate hooks
 * against a document including all locale data.
 * It will run each field's beforeDuplicate hook
 * and return the resulting docWithLocales.
 */
export declare const beforeDuplicate: <T extends JsonObject>({ id, collection, context, doc, overrideAccess, req, }: Args<T>) => Promise<T>;
export {};
//# sourceMappingURL=index.d.ts.map