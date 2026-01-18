import React from 'react';
import './index.scss';
type Props = {
    readonly columns: React.ReactNode[];
    readonly disabled?: boolean;
    readonly dragData?: Record<string, unknown>;
    readonly id: number | string;
    readonly isDroppable?: boolean;
    readonly isFocused?: boolean;
    readonly isSelected?: boolean;
    readonly isSelecting?: boolean;
    readonly itemKey: string;
    readonly onClick?: (e: React.MouseEvent) => void;
    readonly onKeyDown?: (e: React.KeyboardEvent) => void;
};
export declare function DraggableTableRow({ id, columns, disabled, dragData, isDroppable: _isDroppable, isFocused, isSelected, isSelecting, itemKey, onClick, onKeyDown, }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map