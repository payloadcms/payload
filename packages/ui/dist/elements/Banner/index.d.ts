import type { MouseEvent } from 'react';
import React from 'react';
import './index.scss';
type onClick = (event: MouseEvent) => void;
export type Props = Readonly<{
    alignIcon?: 'left' | 'right';
    children?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    onClick?: onClick;
    to?: string;
    type?: 'default' | 'error' | 'info' | 'success';
}>;
export type RenderedTypeProps = {
    children?: React.ReactNode;
    className?: string;
    onClick?: onClick;
    to: string;
};
export declare const Banner: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map