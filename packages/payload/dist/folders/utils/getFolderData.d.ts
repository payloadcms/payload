import type { CollectionSlug } from '../../index.js';
import type { PayloadRequest, Where } from '../../types/index.js';
import type { FolderSortKeys, GetFolderDataResult } from '../types.js';
type Args = {
    /**
     * Specify to query documents from a specific collection
     * @default undefined
     * @example 'posts'
     */
    collectionSlug?: CollectionSlug;
    /**
     * Optional where clause to filter documents by
     * @default undefined
     */
    documentWhere?: Where;
    /**
     * The ID of the folder to query documents from
     * @default undefined
     */
    folderID?: number | string;
    /** Optional where clause to filter subfolders by
     * @default undefined
     */
    folderWhere?: Where;
    req: PayloadRequest;
    sort: FolderSortKeys;
};
/**
 * Query for documents, subfolders and breadcrumbs for a given folder
 */
export declare const getFolderData: ({ collectionSlug, documentWhere, folderID: _folderID, folderWhere, req, sort, }: Args) => Promise<GetFolderDataResult>;
export {};
//# sourceMappingURL=getFolderData.d.ts.map