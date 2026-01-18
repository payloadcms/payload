import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import { type Payload, type TypedUser } from '../../../index.js';
type Args = {
    collection: SanitizedCollectionConfig;
    payload: Payload;
    user: TypedUser;
};
export declare const incrementLoginAttempts: ({ collection, payload, user, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=incrementLoginAttempts.d.ts.map