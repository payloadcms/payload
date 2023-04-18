import { MouseEvent } from 'react';
type onClick = (event: MouseEvent) => void;
export type Props = {
    children?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    alignIcon?: 'left' | 'right';
    onClick?: onClick;
    to?: string;
    type?: 'error' | 'success' | 'info' | 'default';
};
export type RenderedTypeProps = {
    className?: string;
    onClick?: onClick;
    to: string;
    children?: React.ReactNode;
};
export {};
