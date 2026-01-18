import React from 'react';
import './index.scss';
type Props = {
    readonly as?: React.ElementType;
    readonly children?: React.ReactNode;
    readonly className?: string;
    readonly disabled?: boolean;
    readonly onClick: (e: React.MouseEvent) => void;
    readonly onKeyDown?: (e: React.KeyboardEvent) => void;
    readonly ref?: React.RefObject<HTMLDivElement>;
    readonly thresholdPixels?: number;
};
export declare const DraggableWithClick: ({ as, children, className, disabled, onClick, onKeyDown, ref, thresholdPixels, }: Props) => React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map