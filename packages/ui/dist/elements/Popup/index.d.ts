import type { CSSProperties } from 'react';
export * as PopupList from './PopupButtonList/index.js';
import React from 'react';
import './index.scss';
export type PopupProps = {
    backgroundColor?: CSSProperties['backgroundColor'];
    boundingRef?: React.RefObject<HTMLElement>;
    button?: React.ReactNode;
    buttonClassName?: string;
    buttonSize?: 'large' | 'medium' | 'small' | 'xsmall';
    buttonType?: 'custom' | 'default' | 'none';
    caret?: boolean;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    /**
     * Force control the open state of the popup, regardless of the trigger.
     */
    forceOpen?: boolean;
    /**
     * Preferred horizontal alignment of the popup, if there is enough space available.
     *
     * @default 'left'
     */
    horizontalAlign?: 'center' | 'left' | 'right';
    id?: string;
    initActive?: boolean;
    noBackground?: boolean;
    onToggleClose?: () => void;
    onToggleOpen?: (active: boolean) => void;
    render?: (args: {
        close: () => void;
    }) => React.ReactNode;
    showOnHover?: boolean;
    /**
     * By default, the scrollbar is hidden. If you want to show it, set this to true.
     * In both cases, the container is still scrollable.
     *
     * @default false
     */
    showScrollbar?: boolean;
    size?: 'fit-content' | 'large' | 'medium' | 'small';
    /**
     * Preferred vertical alignment of the popup (position below or above the trigger),
     * if there is enough space available.
     *
     * If the popup is too close to the edge of the viewport, it will flip to the opposite side
     * regardless of the preferred vertical alignment.
     *
     * @default 'bottom'
     */
    verticalAlign?: 'bottom' | 'top';
};
/**
 * Component that renders a popup, as well as a button that triggers the popup.
 *
 * The popup is rendered in a portal, and is automatically positioned above / below the trigger,
 * depending on the verticalAlign prop and the space available.
 */
export declare const Popup: React.FC<PopupProps>;
//# sourceMappingURL=index.d.ts.map