import type { PayloadRequest } from '../types/index.js';
import type { SanitizedPermissions } from './types.js';
type GetAccessResultsArgs = {
    req: PayloadRequest;
};
export declare function getAccessResults({ req, }: GetAccessResultsArgs): Promise<SanitizedPermissions>;
export {};
//# sourceMappingURL=getAccessResults.d.ts.map