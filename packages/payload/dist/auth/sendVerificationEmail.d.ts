import type { Collection } from '../collections/config/types.js';
import type { SanitizedConfig } from '../config/types.js';
import type { InitializedEmailAdapter } from '../email/types.js';
import type { TypedUser } from '../index.js';
import type { PayloadRequest } from '../types/index.js';
type Args = {
    collection: Collection;
    config: SanitizedConfig;
    disableEmail: boolean;
    email: InitializedEmailAdapter;
    req: PayloadRequest;
    token: string;
    user: TypedUser;
};
export declare function sendVerificationEmail(args: Args): Promise<void>;
export {};
//# sourceMappingURL=sendVerificationEmail.d.ts.map