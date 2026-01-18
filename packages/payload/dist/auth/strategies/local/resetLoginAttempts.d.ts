import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js';
import type { Payload } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
type Args = {
    collection: SanitizedCollectionConfig;
    doc: Record<string, unknown> & TypeWithID;
    payload: Payload;
    req: PayloadRequest;
};
export declare const resetLoginAttempts: ({ collection, doc, payload, req, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=resetLoginAttempts.d.ts.map