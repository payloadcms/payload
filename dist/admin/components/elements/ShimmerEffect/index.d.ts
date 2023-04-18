import * as React from 'react';
import './index.scss';
type ShimmerEffectT = {
    animationDelay?: string;
    height?: number | string;
    width?: number | string;
};
export declare const ShimmerEffect: React.FC<ShimmerEffectT>;
type StaggeredShimmersT = {
    count: number;
    shimmerDelay?: number | string;
    height?: number | string;
    width?: number | string;
    className?: string;
    shimmerItemClassName?: string;
    renderDelay?: number;
};
export declare const StaggeredShimmers: React.FC<StaggeredShimmersT>;
export {};
