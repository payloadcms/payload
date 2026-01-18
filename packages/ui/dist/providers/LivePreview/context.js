'use client';

import { createContext, use } from 'react';
export const LivePreviewContext = createContext({
  appIsReady: false,
  breakpoint: undefined,
  breakpoints: undefined,
  iframeRef: undefined,
  isLivePreviewEnabled: undefined,
  isLivePreviewing: false,
  isPopupOpen: false,
  isPreviewEnabled: undefined,
  measuredDeviceSize: {
    height: 0,
    width: 0
  },
  openPopupWindow: () => {},
  popupRef: undefined,
  previewURL: undefined,
  previewWindowType: 'iframe',
  setAppIsReady: () => {},
  setBreakpoint: () => {},
  setHeight: () => {},
  setIsLivePreviewing: () => {},
  setLoadedURL: () => {},
  setMeasuredDeviceSize: () => {},
  setPreviewURL: () => {},
  setPreviewWindowType: () => {},
  setSize: () => {},
  setToolbarPosition: () => {},
  setURL: () => {},
  setWidth: () => {},
  setZoom: () => {},
  size: {
    height: 0,
    width: 0
  },
  toolbarPosition: {
    x: 0,
    y: 0
  },
  typeofLivePreviewURL: undefined,
  url: undefined,
  zoom: 1
});
export const useLivePreviewContext = () => use(LivePreviewContext);
/**
 * Hook to access live preview context values. Separated to prevent breaking changes. In the future this hook can be removed in favour of just using the LivePreview one.
 */
export const usePreviewURL = () => {
  const {
    isPreviewEnabled,
    previewURL,
    setPreviewURL
  } = use(LivePreviewContext);
  return {
    isPreviewEnabled,
    previewURL,
    setPreviewURL
  };
};
//# sourceMappingURL=context.js.map