import type { CollectionSlug } from 'payload';
import type { FolderOrDocument } from 'payload/shared';
import React from 'react';
import './index.scss';
type ActionProps = {
    readonly action: 'moveItemsToFolder';
} | {
    readonly action: 'moveItemToFolder';
    readonly title: string;
};
export type MoveToFolderDrawerProps = {
    readonly drawerSlug: string;
    readonly folderAssignedCollections: CollectionSlug[];
    readonly folderCollectionSlug: string;
    readonly folderFieldName: string;
    readonly fromFolderID?: number | string;
    readonly fromFolderName?: string;
    readonly itemsToMove: FolderOrDocument[];
    /**
     * Callback function to be called when the user confirms the move
     *
     * @param folderID - The ID of the folder to move the items to
     */
    readonly onConfirm: (args: {
        id: null | number | string;
        name: null | string;
    }) => Promise<void> | void;
    readonly populateMoveToFolderDrawer?: (folderID: null | number | string) => Promise<void> | void;
    /**
     * Set to `true` to skip the confirmation modal
     * @default false
     */
    readonly skipConfirmModal?: boolean;
} & ActionProps;
export declare function MoveItemsToFolderDrawer(props: MoveToFolderDrawerProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map