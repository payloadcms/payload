import * as React from 'react';
import './index.scss';
export type ShimmerEffectProps = {
    readonly animationDelay?: string;
    readonly className?: string;
    readonly disableInlineStyles?: boolean;
    readonly height?: number | string;
    readonly width?: number | string;
};
export declare const ShimmerEffect: React.FC<ShimmerEffectProps>;
export type StaggeredShimmersProps = {
    className?: string;
    count: number;
    height?: number | string;
    renderDelay?: number;
    shimmerDelay?: number | string;
    shimmerItemClassName?: string;
    width?: number | string;
};
export declare const StaggeredShimmers: React.FC<StaggeredShimmersProps>;
//# sourceMappingURL=index.d.ts.map