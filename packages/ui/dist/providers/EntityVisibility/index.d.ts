import type { SanitizedCollectionConfig, SanitizedGlobalConfig, VisibleEntities } from 'payload';
import React from 'react';
export type VisibleEntitiesContextType = {
    isEntityVisible: ({ collectionSlug, globalSlug, }: {
        collectionSlug?: SanitizedCollectionConfig['slug'];
        globalSlug?: SanitizedGlobalConfig['slug'];
    }) => boolean;
    visibleEntities: VisibleEntities;
};
export declare const EntityVisibilityContext: React.Context<VisibleEntitiesContextType>;
export declare const EntityVisibilityProvider: React.FC<{
    children: React.ReactNode;
    visibleEntities?: VisibleEntities;
}>;
export declare const useEntityVisibility: () => VisibleEntitiesContextType;
//# sourceMappingURL=index.d.ts.map