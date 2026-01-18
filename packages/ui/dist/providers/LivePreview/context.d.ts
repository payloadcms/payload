import type { LivePreviewConfig, LivePreviewURLType } from 'payload';
import type { Dispatch } from 'react';
import type React from 'react';
import type { usePopupWindow } from '../../hooks/usePopupWindow.js';
import type { SizeReducerAction } from './sizeReducer.js';
export interface LivePreviewContextType {
    appIsReady: boolean;
    breakpoint: LivePreviewConfig['breakpoints'][number]['name'];
    breakpoints: LivePreviewConfig['breakpoints'];
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    isLivePreviewEnabled: boolean;
    isLivePreviewing: boolean;
    isPopupOpen: boolean;
    isPreviewEnabled: boolean;
    listeningForMessages?: boolean;
    /**
     * The URL that has finished loading in the iframe or popup.
     * For example, if you set the `url`, it will begin to load into the iframe,
     * but `loadedURL` will not be set until the iframe's `onLoad` event fires.
     */
    loadedURL?: string;
    measuredDeviceSize: {
        height: number;
        width: number;
    };
    openPopupWindow: ReturnType<typeof usePopupWindow>['openPopupWindow'];
    popupRef?: React.RefObject<null | Window>;
    previewURL?: string;
    previewWindowType: 'iframe' | 'popup';
    setAppIsReady: (appIsReady: boolean) => void;
    setBreakpoint: (breakpoint: LivePreviewConfig['breakpoints'][number]['name']) => void;
    setHeight: (height: number) => void;
    setIsLivePreviewing: (isLivePreviewing: boolean) => void;
    setLoadedURL: (loadedURL: string) => void;
    setMeasuredDeviceSize: (size: {
        height: number;
        width: number;
    }) => void;
    setPreviewURL: (url: string) => void;
    setPreviewWindowType: (previewWindowType: 'iframe' | 'popup') => void;
    setSize: Dispatch<SizeReducerAction>;
    setToolbarPosition: (position: {
        x: number;
        y: number;
    }) => void;
    /**
     * Sets the URL of the preview (either iframe or popup).
     * Will trigger a reload of the window.
     */
    setURL: (url: string) => void;
    setWidth: (width: number) => void;
    setZoom: (zoom: number) => void;
    size: {
        height: number;
        width: number;
    };
    toolbarPosition: {
        x: number;
        y: number;
    };
    /**
     * The live preview url property can be either a string or a function that returns a string.
     * It is important to know which one it is, so that we can opt in/out of certain behaviors, e.g. calling the server to get the URL.
     */
    typeofLivePreviewURL?: 'function' | 'string';
    url: LivePreviewURLType;
    zoom: number;
}
export declare const LivePreviewContext: React.Context<LivePreviewContextType>;
export declare const useLivePreviewContext: () => LivePreviewContextType;
/**
 * Hook to access live preview context values. Separated to prevent breaking changes. In the future this hook can be removed in favour of just using the LivePreview one.
 */
export declare const usePreviewURL: () => {
    isPreviewEnabled: boolean;
    previewURL: string;
    setPreviewURL: (url: string) => void;
};
//# sourceMappingURL=context.d.ts.map