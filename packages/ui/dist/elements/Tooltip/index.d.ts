import React from 'react';
import './index.scss';
export type Props = {
    alignCaret?: 'center' | 'left' | 'right';
    boundingRef?: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    className?: string;
    delay?: number;
    position?: 'bottom' | 'top';
    show?: boolean;
    /**
     * If the tooltip position should not change depending on if the toolbar is outside the boundingRef. @default false
     */
    staticPositioning?: boolean;
};
export declare const Tooltip: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map