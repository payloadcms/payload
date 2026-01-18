import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { Payload } from '../index.js';
import type { PayloadRequest } from '../types/index.js';
type Args = {
    collectionConfig: SanitizedCollectionConfig;
    /**
     * User IDs to delete
     */
    ids: (number | string)[];
    payload: Payload;
    req: PayloadRequest;
};
export declare const deleteUserPreferences: ({ collectionConfig, ids, payload, req }: Args) => Promise<void>;
export {};
//# sourceMappingURL=deleteUserPreferences.d.ts.map