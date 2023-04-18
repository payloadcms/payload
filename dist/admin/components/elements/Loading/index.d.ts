import React from 'react';
import type { LoadingOverlayTypes } from '../../utilities/LoadingOverlay/types';
import './index.scss';
type Props = {
    show?: boolean;
    loadingText?: string;
    overlayType?: string;
    animationDuration?: string;
};
export declare const LoadingOverlay: React.FC<Props>;
type UseLoadingOverlayToggleT = {
    show: boolean;
    name: string;
    type?: LoadingOverlayTypes;
    loadingText?: string;
};
export declare const LoadingOverlayToggle: React.FC<UseLoadingOverlayToggleT>;
type FormLoadingOverlayToggleT = {
    name: string;
    type?: LoadingOverlayTypes;
    formIsLoading?: boolean;
    action: 'loading' | 'create' | 'update';
    loadingSuffix?: string;
};
export declare const FormLoadingOverlayToggle: React.FC<FormLoadingOverlayToggleT>;
export {};
