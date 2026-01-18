import type { CollectionSlug, Document } from '../../index.js';
import type { FolderOrDocument } from '../types.js';
type Args = {
    folderFieldName: string;
    isUpload: boolean;
    relationTo: CollectionSlug;
    useAsTitle?: string;
    value: Document;
};
export declare function formatFolderOrDocumentItem({ folderFieldName, isUpload, relationTo, useAsTitle, value, }: Args): FolderOrDocument;
export {};
//# sourceMappingURL=formatFolderOrDocumentItem.d.ts.map