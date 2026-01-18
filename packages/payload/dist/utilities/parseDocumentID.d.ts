import type { CollectionSlug, Payload } from '../index.js';
type ParseDocumentIDArgs = {
    collectionSlug: CollectionSlug;
    id?: number | string;
    payload: Payload;
};
export declare function parseDocumentID({ id, collectionSlug, payload }: ParseDocumentIDArgs): string | number | undefined;
export {};
//# sourceMappingURL=parseDocumentID.d.ts.map