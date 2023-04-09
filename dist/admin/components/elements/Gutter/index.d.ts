import React, { Ref } from 'react';
import './index.scss';
type Props = {
    left?: boolean;
    right?: boolean;
    negativeLeft?: boolean;
    negativeRight?: boolean;
    className?: string;
    children: React.ReactNode;
    ref?: Ref<HTMLDivElement>;
};
export declare const Gutter: React.FC<Props>;
export {};
