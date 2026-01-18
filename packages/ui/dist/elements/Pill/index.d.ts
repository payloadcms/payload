import type { HTMLAttributes } from 'react';
import React from 'react';
export type PillStyle = 'always-white' | 'dark' | 'error' | 'light' | 'light-gray' | 'success' | 'warning' | 'white';
export type PillProps = {
    alignIcon?: 'left' | 'right';
    'aria-checked'?: boolean;
    'aria-controls'?: string;
    'aria-expanded'?: boolean;
    'aria-label'?: string;
    children?: React.ReactNode;
    className?: string;
    draggable?: boolean;
    elementProps?: {
        ref: React.RefCallback<HTMLElement>;
    } & HTMLAttributes<HTMLElement>;
    icon?: React.ReactNode;
    id?: string;
    onClick?: () => void;
    /**
     * @default 'light'
     */
    pillStyle?: PillStyle;
    rounded?: boolean;
    size?: 'medium' | 'small';
    to?: string;
};
export type RenderedTypeProps = {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    to: string;
    type?: 'button';
};
import './index.scss';
export declare const Pill: React.FC<PillProps>;
//# sourceMappingURL=index.d.ts.map