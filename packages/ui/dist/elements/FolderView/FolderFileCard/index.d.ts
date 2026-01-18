import type { FolderOrDocument } from 'payload/shared';
import React from 'react';
import './index.scss';
type Props = {
    readonly className?: string;
    readonly disabled?: boolean;
    readonly folderType?: string[];
    readonly id: number | string;
    readonly isDeleting?: boolean;
    readonly isFocused?: boolean;
    readonly isSelected?: boolean;
    readonly itemKey: string;
    readonly onClick?: (e: React.MouseEvent) => void;
    readonly onKeyDown?: (e: React.KeyboardEvent) => void;
    readonly PopupActions?: React.ReactNode;
    readonly previewUrl?: string;
    readonly selectedCount?: number;
    readonly title: string;
    readonly type: 'file' | 'folder';
};
export declare function FolderFileCard({ id, type, className, disabled, folderType, isDeleting, isFocused, isSelected, itemKey, onClick, onKeyDown, PopupActions, previewUrl, selectedCount, title, }: Props): React.JSX.Element;
type ContextCardProps = {
    readonly className?: string;
    readonly index: number;
    readonly item: FolderOrDocument;
    readonly type: 'file' | 'folder';
};
export declare function ContextFolderFileCard({ type, className, index, item }: ContextCardProps): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map