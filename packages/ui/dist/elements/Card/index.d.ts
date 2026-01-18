import React from 'react';
import './index.scss';
export type Props = {
    actions?: React.ReactNode;
    buttonAriaLabel?: string;
    href?: string;
    id?: string;
    /**
     * @deprecated
     * This prop is deprecated and will be removed in the next major version.
     * Components now import their own `Link` directly from `next/link`.
     */
    Link?: React.ElementType;
    onClick?: () => void;
    title: string;
    titleAs?: React.ElementType;
};
export declare const Card: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map