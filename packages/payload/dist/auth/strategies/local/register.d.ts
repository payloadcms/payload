import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { JsonObject, Payload } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
type Args = {
    collection: SanitizedCollectionConfig;
    doc: JsonObject;
    password: string;
    payload: Payload;
    req: PayloadRequest;
};
export declare const registerLocalStrategy: ({ collection, doc, password, payload, req, }: Args) => Promise<Record<string, unknown>>;
export {};
//# sourceMappingURL=register.d.ts.map