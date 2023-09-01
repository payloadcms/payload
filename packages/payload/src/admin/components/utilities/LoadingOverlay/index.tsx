import React, { createContext } from 'react'
import { useTranslation } from 'react-i18next'

import type { LoadingOverlayContext, ToggleLoadingOverlay } from './types'

import { useDelayedRender } from '../../../hooks/useDelayedRender'
import { LoadingOverlay } from '../../elements/Loading'
import { defaultLoadingOverlayState, reducer } from './reducer'

const animatedDuration = 250

const Context = createContext({
  isOnScreen: false,
  toggleLoadingOverlay: undefined,
})

export const LoadingOverlayProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('general')
  const fallbackText = t('loading')
  const [overlays, dispatchOverlay] = React.useReducer(reducer, defaultLoadingOverlayState)

  const { isMounted, isUnmounting, triggerDelayedRender } = useDelayedRender({
    delayBeforeShow: 1000,
    inTimeout: animatedDuration,
    minShowTime: 500,
    outTimeout: animatedDuration,
    show: overlays.isLoading,
  })

  const toggleLoadingOverlay = React.useCallback<ToggleLoadingOverlay>(
    ({ isLoading, key, loadingText = fallbackText, type }) => {
      if (isLoading) {
        triggerDelayedRender()
        dispatchOverlay({
          payload: {
            key,
            loadingText,
            type,
          },
          type: 'add',
        })
      } else {
        dispatchOverlay({
          payload: {
            key,
            type,
          },
          type: 'remove',
        })
      }
    },
    [triggerDelayedRender, fallbackText],
  )

  return (
    <Context.Provider
      value={{
        isOnScreen: isMounted,
        toggleLoadingOverlay,
      }}
    >
      {isMounted && (
        <LoadingOverlay
          animationDuration={`${animatedDuration}ms`}
          loadingText={overlays.loadingText || fallbackText}
          overlayType={overlays.overlayType}
          show={!isUnmounting}
        />
      )}
      {children}
    </Context.Provider>
  )
}

export const useLoadingOverlay = (): LoadingOverlayContext => {
  const contextHook = React.useContext(Context)
  if (contextHook === undefined) {
    throw new Error('useLoadingOverlay must be used within a LoadingOverlayProvider')
  }

  return contextHook
}

export default Context
