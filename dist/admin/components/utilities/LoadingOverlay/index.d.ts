import React from 'react';
import type { LoadingOverlayContext } from './types';
declare const Context: React.Context<{
    toggleLoadingOverlay: any;
    isOnScreen: boolean;
}>;
export declare const LoadingOverlayProvider: React.FC<{
    children?: React.ReactNode;
}>;
export declare const useLoadingOverlay: () => LoadingOverlayContext;
export default Context;
