import type { Collection } from '../../collections/config/types.js';
import type { PayloadRequest } from '../../types/index.js';
export type Arguments = {
    allSessions?: boolean;
    collection: Collection;
    req: PayloadRequest;
};
export declare const logoutOperation: (incomingArgs: Arguments) => Promise<boolean>;
//# sourceMappingURL=logout.d.ts.map