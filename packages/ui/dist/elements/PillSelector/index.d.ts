import React from 'react';
import './index.scss';
export type SelectablePill = {
    key?: string;
    Label?: React.ReactNode;
    name: string;
    selected: boolean;
};
export type Props = {
    draggable?: {
        onDragEnd: (args: {
            moveFromIndex: number;
            moveToIndex: number;
        }) => void;
    };
    onClick?: (args: {
        pill: SelectablePill;
    }) => Promise<void> | void;
    pills: SelectablePill[];
};
/**
 * Displays a wrappable list of pills that can be selected or deselected.
 * If `draggable` is true, the pills can be reordered by dragging.
 */
export declare const PillSelector: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map