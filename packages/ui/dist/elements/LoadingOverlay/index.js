'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { createContext } from 'react';
import { LoadingOverlay } from '../../elements/Loading/index.js';
import { useDelayedRender } from '../../hooks/useDelayedRender.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { defaultLoadingOverlayState, reducer } from './reducer.js';
const animatedDuration = 250;
const Context = /*#__PURE__*/createContext({
  isOnScreen: false,
  toggleLoadingOverlay: undefined
});
export const LoadingOverlayProvider = ({
  children
}) => {
  const {
    t
  } = useTranslation();
  const fallbackText = t('general:loading');
  const [overlays, dispatchOverlay] = React.useReducer(reducer, defaultLoadingOverlayState);
  const {
    isMounted,
    isUnmounting,
    triggerDelayedRender
  } = useDelayedRender({
    delayBeforeShow: 1000,
    inTimeout: animatedDuration,
    minShowTime: 500,
    outTimeout: animatedDuration,
    show: overlays.isLoading
  });
  const toggleLoadingOverlay = React.useCallback(({
    type,
    isLoading,
    key,
    loadingText = fallbackText
  }) => {
    if (isLoading) {
      triggerDelayedRender();
      dispatchOverlay({
        type: 'add',
        payload: {
          type,
          key,
          loadingText
        }
      });
    } else {
      dispatchOverlay({
        type: 'remove',
        payload: {
          type,
          key
        }
      });
    }
  }, [triggerDelayedRender, fallbackText]);
  return /*#__PURE__*/_jsxs(Context, {
    value: {
      isOnScreen: isMounted,
      toggleLoadingOverlay
    },
    children: [isMounted && /*#__PURE__*/_jsx(LoadingOverlay, {
      animationDuration: `${animatedDuration}ms`,
      loadingText: overlays.loadingText || fallbackText,
      overlayType: overlays.overlayType,
      show: !isUnmounting
    }), children]
  });
};
export const useLoadingOverlay = () => {
  const contextHook = React.use(Context);
  if (contextHook === undefined) {
    throw new Error('useLoadingOverlay must be used within a LoadingOverlayProvider');
  }
  return contextHook;
};
//# sourceMappingURL=index.js.map