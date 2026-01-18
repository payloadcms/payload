import { type FolderOrDocument } from 'payload/shared';
import React from 'react';
import type { Props as ButtonProps } from '../../Button/types.js';
import './index.scss';
/**
 * This is the button shown on the edit document view. It uses the more generic `MoveDocToFolderButton` component.
 */
export declare function MoveDocToFolder({ buttonProps, className, folderCollectionSlug, folderFieldName, }: {
    readonly buttonProps?: Partial<ButtonProps>;
    readonly className?: string;
    readonly folderCollectionSlug: string;
    readonly folderFieldName: string;
}): React.JSX.Element;
type MoveDocToFolderButtonProps = {
    readonly buttonProps?: Partial<ButtonProps>;
    readonly className?: string;
    readonly collectionSlug: string;
    readonly docData: FolderOrDocument['value'];
    readonly docID: number | string;
    readonly docTitle?: string;
    readonly folderCollectionSlug: string;
    readonly folderFieldName: string;
    readonly fromFolderID?: number | string;
    readonly fromFolderName: string;
    readonly modalSlug: string;
    readonly onConfirm?: (args: {
        id: number | string;
        name: string;
    }) => Promise<void> | void;
    readonly skipConfirmModal?: boolean;
};
/**
 * This is a more generic button that can be used in other contexts, such as table cells and the edit view.
 */
export declare const MoveDocToFolderButton: ({ buttonProps, className, collectionSlug, docData, docID, docTitle, folderCollectionSlug, folderFieldName, fromFolderID, fromFolderName, modalSlug, onConfirm, skipConfirmModal, }: MoveDocToFolderButtonProps) => React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map