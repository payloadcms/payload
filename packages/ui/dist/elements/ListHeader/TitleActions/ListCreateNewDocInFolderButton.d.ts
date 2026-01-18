import type { CollectionSlug } from 'payload';
import React from 'react';
export declare function ListCreateNewDocInFolderButton({ buttonLabel, collectionSlugs, folderAssignedCollections, onCreateSuccess, slugPrefix, }: {
    buttonLabel: string;
    collectionSlugs: CollectionSlug[];
    folderAssignedCollections: CollectionSlug[];
    onCreateSuccess: (args: {
        collectionSlug: CollectionSlug;
        doc: Record<string, unknown>;
    }) => Promise<void> | void;
    slugPrefix: string;
}): React.JSX.Element;
//# sourceMappingURL=ListCreateNewDocInFolderButton.d.ts.map