import type { PayloadRequest } from '../../types/index.js';
import type { SanitizedPermissions } from '../types.js';
type Arguments = {
    req: PayloadRequest;
};
export declare const accessOperation: (args: Arguments) => Promise<SanitizedPermissions>;
export {};
//# sourceMappingURL=access.d.ts.map