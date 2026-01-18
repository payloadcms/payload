import type { CollectionBeforeDeleteHook } from '../../index.js';
type Args = {
    folderFieldName: string;
    folderSlug: string;
};
export declare const deleteSubfoldersBeforeDelete: ({ folderFieldName, folderSlug, }: Args) => CollectionBeforeDeleteHook;
export {};
//# sourceMappingURL=deleteSubfoldersAfterDelete.d.ts.map