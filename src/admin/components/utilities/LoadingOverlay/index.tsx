import React, { createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useDelayedRender } from '../../../hooks/useDelayedRender';
import { reducer, defaultLoadingOverlayState } from './reducer';
import { LoadingOverlay } from '../../elements/Loading';
import type { LoadingOverlayContext, ToggleLoadingOverlay } from './types';

const initialContext: LoadingOverlayContext = {
  toggleLoadingOverlay: undefined,
  isOnScreen: false,
};

const Context = createContext(initialContext);

export const LoadingOverlayProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('general');
  const fallbackText = t('loading');

  const [overlays, dispatchOverlay] = React.useReducer(reducer, defaultLoadingOverlayState);

  const {
    isMounted,
    isUnmounting,
    triggerDelayedRender,
  } = useDelayedRender({
    show: overlays.isLoading,
  });

  const toggleLoadingOverlay = React.useCallback<ToggleLoadingOverlay>(({ type, key, isLoading, loadingText = fallbackText }) => {
    if (isLoading) {
      triggerDelayedRender();
      dispatchOverlay({
        type: 'add',
        payload: {
          type,
          key,
          loadingText,
        },
      });
    } else {
      dispatchOverlay({
        type: 'remove',
        payload: {
          key,
          type,
        },
      });
    }
  }, [triggerDelayedRender, fallbackText]);

  return (
    <Context.Provider
      value={{
        toggleLoadingOverlay,
        isOnScreen: isMounted,
      }}
    >
      {isMounted && (
        <LoadingOverlay
          show={!isUnmounting}
          loadingText={overlays.loadingText || fallbackText}
          overlayType={overlays.overlayType}
        />
      )}
      {children}
    </Context.Provider>
  );
};

export const useLoadingOverlay = (): LoadingOverlayContext => {
  const contextHook = React.useContext(Context);
  if (contextHook === undefined) {
    throw new Error('useLoadingOverlay must be used within a LoadingOverlayProvider');
  }

  return contextHook;
};

export default Context;
