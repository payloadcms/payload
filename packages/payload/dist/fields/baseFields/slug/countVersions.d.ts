import type { CollectionSlug, DefaultDocumentIDType, GlobalSlug, PayloadRequest } from '../../../index.js';
/**
 * This is a cross-entity way to count the number of versions for any given document.
 * It will work for both collections and globals.
 * @returns number of versions
 */
export declare const countVersions: (args: {
    collectionSlug?: CollectionSlug;
    globalSlug?: GlobalSlug;
    parentID?: DefaultDocumentIDType;
    req: PayloadRequest;
}) => Promise<number>;
//# sourceMappingURL=countVersions.d.ts.map