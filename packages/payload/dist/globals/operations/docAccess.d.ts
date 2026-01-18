import type { SanitizedGlobalPermission } from '../../auth/index.js';
import type { JsonObject, PayloadRequest } from '../../types/index.js';
import type { SanitizedGlobalConfig } from '../config/types.js';
type Arguments = {
    /**
     * If the document data is passed, it will be used to check access instead of fetching the document from the database.
     */
    data?: JsonObject;
    globalConfig: SanitizedGlobalConfig;
    req: PayloadRequest;
};
export declare const docAccessOperation: (args: Arguments) => Promise<SanitizedGlobalPermission>;
export {};
//# sourceMappingURL=docAccess.d.ts.map