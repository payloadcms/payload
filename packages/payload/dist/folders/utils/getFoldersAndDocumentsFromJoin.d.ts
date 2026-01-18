import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest, Where } from '../../types/index.js';
import type { FolderOrDocument } from '../types.js';
type QueryDocumentsAndFoldersResults = {
    documents: FolderOrDocument[];
    folderAssignedCollections: CollectionSlug[];
    subfolders: FolderOrDocument[];
};
type QueryDocumentsAndFoldersArgs = {
    /**
     * Optional where clause to filter documents by
     * @default undefined
     */
    documentWhere?: Where;
    /** Optional where clause to filter subfolders by
     * @default undefined
     */
    folderWhere?: Where;
    parentFolderID: number | string;
    req: PayloadRequest;
};
export declare function queryDocumentsAndFoldersFromJoin({ documentWhere, folderWhere, parentFolderID, req, }: QueryDocumentsAndFoldersArgs): Promise<QueryDocumentsAndFoldersResults>;
export {};
//# sourceMappingURL=getFoldersAndDocumentsFromJoin.d.ts.map