import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import type { RequestContext } from '../../../index.js';
import type { JsonObject, Operation, PayloadRequest } from '../../../types/index.js';
export type Args<T extends JsonObject> = {
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    data: T;
    doc: T;
    docWithLocales: JsonObject;
    global: null | SanitizedGlobalConfig;
    id?: number | string;
    operation: Operation;
    overrideAccess?: boolean;
    req: PayloadRequest;
    skipValidation?: boolean;
};
/**
 * This function is responsible for the following actions, in order:
 * - Run condition
 * - Execute field hooks
 * - Validate data
 * - Transform data for storage
 * - Unflatten locales. The input `data` is the normal document for one locale. The output result will become the document with locales.
 */
export declare const beforeChange: <T extends JsonObject>({ id, collection, context, data: incomingData, doc, docWithLocales, global, operation, overrideAccess, req, skipValidation, }: Args<T>) => Promise<T>;
//# sourceMappingURL=index.d.ts.map