import type { Collection } from '../../collections/config/types.js';
import type { Document, PayloadRequest } from '../../types/index.js';
export type Result = {
    exp: number;
    refreshedToken: string;
    setCookie?: boolean;
    /** @deprecated
     * use:
     * ```ts
     * user._strategy
     * ```
     */
    strategy?: string;
    user: Document;
};
export type Arguments = {
    collection: Collection;
    req: PayloadRequest;
};
export declare const refreshOperation: (incomingArgs: Arguments) => Promise<Result>;
//# sourceMappingURL=refresh.d.ts.map