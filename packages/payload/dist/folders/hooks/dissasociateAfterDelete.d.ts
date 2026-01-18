import type { CollectionAfterDeleteHook } from '../../index.js';
type Args = {
    collectionSlugs: string[];
    folderFieldName: string;
};
export declare const dissasociateAfterDelete: ({ collectionSlugs, folderFieldName, }: Args) => CollectionAfterDeleteHook;
export {};
//# sourceMappingURL=dissasociateAfterDelete.d.ts.map