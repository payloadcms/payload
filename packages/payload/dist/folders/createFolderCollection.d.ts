import type { CollectionConfig } from '../collections/config/types.js';
type CreateFolderCollectionArgs = {
    collectionSpecific: boolean;
    debug?: boolean;
    folderEnabledCollections: CollectionConfig[];
    folderFieldName: string;
    slug: string;
};
export declare const createFolderCollection: ({ slug, collectionSpecific, debug, folderEnabledCollections, folderFieldName, }: CreateFolderCollectionArgs) => CollectionConfig;
export {};
//# sourceMappingURL=createFolderCollection.d.ts.map