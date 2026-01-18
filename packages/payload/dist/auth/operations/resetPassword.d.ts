import type { Collection } from '../../collections/config/types.js';
import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest } from '../../types/index.js';
export type Result = {
    token?: string;
    user: Record<string, unknown>;
};
export type Arguments = {
    collection: Collection;
    data: {
        password: string;
        token: string;
    };
    depth?: number;
    overrideAccess?: boolean;
    req: PayloadRequest;
};
export declare const resetPasswordOperation: <TSlug extends CollectionSlug>(args: Arguments) => Promise<Result>;
//# sourceMappingURL=resetPassword.d.ts.map