import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../globals/config/types.js';
import type { Payload, PayloadRequest } from '../types/index.js';
type Args = {
    collection?: SanitizedCollectionConfig;
    global?: SanitizedGlobalConfig;
    id?: number | string;
    max: number;
    payload: Payload;
    req?: PayloadRequest;
};
export declare const enforceMaxVersions: ({ id, collection, global: globalConfig, max, payload, req, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=enforceMaxVersions.d.ts.map