import type { CollectionSlug, PayloadRequest, Where } from '../../index.js';
import type { FolderOrDocument } from '../types.js';
type Args = {
    collectionSlug: CollectionSlug;
    folderFieldName: string;
    req: PayloadRequest;
    /**
     * Optional where clause to filter documents by
     * @default undefined
     */
    where?: Where;
};
export declare function getOrphanedDocs({ collectionSlug, folderFieldName, req, where, }: Args): Promise<FolderOrDocument[]>;
export {};
//# sourceMappingURL=getOrphanedDocs.d.ts.map