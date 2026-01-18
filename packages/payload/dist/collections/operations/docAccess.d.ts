import type { SanitizedCollectionPermission } from '../../auth/index.js';
import type { JsonObject, PayloadRequest } from '../../types/index.js';
import type { Collection } from '../config/types.js';
type Arguments = {
    collection: Collection;
    /**
     * If the document data is passed, it will be used to check access instead of fetching the document from the database.
     */
    data?: JsonObject;
    /**
     * When called for creating a new document, id is not provided.
     */
    id?: number | string;
    req: PayloadRequest;
};
export declare function docAccessOperation(args: Arguments): Promise<SanitizedCollectionPermission>;
export {};
//# sourceMappingURL=docAccess.d.ts.map