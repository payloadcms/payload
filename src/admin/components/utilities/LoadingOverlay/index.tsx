import React, {
  createContext, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useTimeoutRender } from '../../../hooks/useSuspendedRender';
import { reducer, defaultLoadingOverlayState } from './reducer';
import { FullscreenLoader } from '../../elements/Loading';
import type { LoadingOverlayContext, ToggleLoadingOverlay } from './types';

const initialContext: LoadingOverlayContext = {
  toggleLoadingOverlay: undefined,
  setLoadingOverlayText: undefined,
};

const Context = createContext(initialContext);

export const LoadingOverlayProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('general');

  const [loadingOverlayText, setLoadingOverlayText] = useState<string>(t('loading'));
  const [overlays, dispatchOverlay] = React.useReducer(reducer, defaultLoadingOverlayState);
  const { isMounted, isUnmounting, triggerRenderTimeout: suspendDisplay } = useTimeoutRender({ show: overlays.isLoading });

  const toggleLoadingOverlay = React.useCallback<ToggleLoadingOverlay>(({ type, key, isLoading }) => {
    if (isLoading) {
      suspendDisplay();
      dispatchOverlay({
        type: 'add',
        payload: {
          type,
          key,
        },
      });
    } else {
      dispatchOverlay({
        type: 'remove',
        payload: {
          key,
        },
      });
    }
  }, [suspendDisplay]);

  return (
    <Context.Provider
      value={{
        setLoadingOverlayText,
        toggleLoadingOverlay,
      }}
    >
      {isMounted && (
        <FullscreenLoader
          show={!isUnmounting}
          loadingText={loadingOverlayText}
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
