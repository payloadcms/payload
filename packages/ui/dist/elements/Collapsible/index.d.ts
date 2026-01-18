import React from 'react';
import type { DragHandleProps } from '../DraggableSortable/DraggableSortableItem/types.js';
import './index.scss';
import { CollapsibleProvider, useCollapsible } from './provider.js';
export { CollapsibleProvider, useCollapsible };
export type CollapsibleProps = {
    actions?: React.ReactNode;
    /**
     * Components that will be rendered within the collapsible provider but after the wrapper.
     */
    AfterCollapsible?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    collapsibleStyle?: 'default' | 'error';
    /**
     * If set to true, clicking on the collapsible header will not toggle the collapsible state.
     * This is useful if the collapsible state is controlled externally (e.g. from a parent component or custom button).
     */
    disableHeaderToggle?: boolean;
    /**
     * If set to true, the toggle indicator (chevron) on the right side of the header will be hidden.
     */
    disableToggleIndicator?: boolean;
    dragHandleProps?: DragHandleProps;
    header?: React.ReactNode;
    initCollapsed?: boolean;
    isCollapsed?: boolean;
    onToggle?: (collapsed: boolean) => Promise<void> | void;
};
export declare const Collapsible: React.FC<CollapsibleProps>;
//# sourceMappingURL=index.d.ts.map