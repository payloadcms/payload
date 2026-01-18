import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js';
import type { FindOneArgs } from '../database/types.js';
import type { Payload, PayloadRequest } from '../types/index.js';
type Args = {
    config: SanitizedCollectionConfig;
    id: number | string;
    payload: Payload;
    published?: boolean;
    query: FindOneArgs;
    req?: PayloadRequest;
};
export declare const getLatestCollectionVersion: <T extends TypeWithID = any>({ id, config, payload, published, query, req, }: Args) => Promise<T | undefined>;
export {};
//# sourceMappingURL=getLatestCollectionVersion.d.ts.map