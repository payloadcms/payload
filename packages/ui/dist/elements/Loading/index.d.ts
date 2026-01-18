import React from 'react';
import type { LoadingOverlayTypes } from '../../elements/LoadingOverlay/types.js';
import './index.scss';
type LoadingOverlayProps = {
    animationDuration?: string;
    loadingText?: string;
    overlayType?: string;
    show?: boolean;
};
export declare const LoadingOverlay: React.FC<LoadingOverlayProps>;
export type UseLoadingOverlayToggleProps = {
    loadingText?: string;
    name: string;
    show: boolean;
    type?: LoadingOverlayTypes;
};
export declare const LoadingOverlayToggle: React.FC<UseLoadingOverlayToggleProps>;
export type FormLoadingOverlayToggleProps = {
    action: 'create' | 'loading' | 'update';
    formIsLoading?: boolean;
    loadingSuffix?: string;
    name: string;
    type?: LoadingOverlayTypes;
};
export declare const FormLoadingOverlayToggle: React.FC<FormLoadingOverlayToggleProps>;
export {};
//# sourceMappingURL=index.d.ts.map