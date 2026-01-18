import type { Modifier } from '@dnd-kit/core';
import type { FolderOrDocument } from 'payload/shared';
import './index.scss';
type DragCardsProps = {
    readonly item: FolderOrDocument;
    readonly selectedCount: number;
};
export declare function DragOverlaySelection({ item, selectedCount }: DragCardsProps): import("react").JSX.Element;
export declare const snapTopLeftToCursor: Modifier;
export {};
//# sourceMappingURL=index.d.ts.map