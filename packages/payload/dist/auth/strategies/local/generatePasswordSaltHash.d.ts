import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { PayloadRequest } from '../../../types/index.js';
type Args = {
    collection: SanitizedCollectionConfig;
    password: string;
    req: PayloadRequest;
};
export declare const generatePasswordSaltHash: ({ collection, password: passwordToSet, req, }: Args) => Promise<{
    hash: string;
    salt: string;
}>;
export {};
//# sourceMappingURL=generatePasswordSaltHash.d.ts.map