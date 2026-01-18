import type { ClientCollectionConfig, CollectionSlug } from 'payload';
type UseEnabledRelationshipsOptions = {
    collectionSlugsBlacklist?: string[];
    collectionSlugsWhitelist?: string[];
    uploads?: boolean;
};
type UseEnabledRelationshipsResult = {
    enabledCollections: ClientCollectionConfig[];
    enabledCollectionSlugs: CollectionSlug[];
};
export declare const useEnabledRelationships: (options?: UseEnabledRelationshipsOptions) => UseEnabledRelationshipsResult;
export {};
//# sourceMappingURL=useEnabledRelationships.d.ts.map