'use client'
import type { CollectionPreferences, LivePreviewConfig, LivePreviewURLType } from '@ruya.sa/payload'

import { DndContext } from '@dnd-kit/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { LivePreviewContextType } from './context.js'

import { usePopupWindow } from '../../hooks/usePopupWindow.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { formatAbsoluteURL } from '../../utilities/formatAbsoluteURL.js'
import { customCollisionDetection } from './collisionDetection.js'
import { LivePreviewContext } from './context.js'
import { sizeReducer } from './sizeReducer.js'

export type LivePreviewProviderProps = {
  appIsReady?: boolean
  breakpoints?: LivePreviewConfig['breakpoints']
  children: React.ReactNode
  deviceSize?: {
    height: number
    width: number
  }
  isLivePreviewEnabled?: boolean
  isLivePreviewing: boolean
  /**
   * This specifically relates to `admin.preview` function in the config instead of live preview.
   */
  isPreviewEnabled?: boolean
  /**
   * This specifically relates to `admin.preview` function in the config instead of live preview.
   */
  previewURL?: string
} & Pick<LivePreviewContextType, 'typeofLivePreviewURL' | 'url'>

export const LivePreviewProvider: React.FC<LivePreviewProviderProps> = ({
  breakpoints: incomingBreakpoints,
  children,
  isLivePreviewEnabled,
  isLivePreviewing: incomingIsLivePreviewing,
  isPreviewEnabled,
  previewURL: previewURLFromProps,
  typeofLivePreviewURL,
  url: urlFromProps,
}) => {
  const [previewWindowType, setPreviewWindowType] = useState<'iframe' | 'popup'>('iframe')
  const [isLivePreviewing, setIsLivePreviewing] = useState(incomingIsLivePreviewing)

  const breakpoints: LivePreviewConfig['breakpoints'] = useMemo(
    () => [
      ...(incomingBreakpoints || []),
      {
        name: 'responsive',
        height: '100%',
        label: 'Responsive',
        width: '100%',
      },
    ],
    [incomingBreakpoints],
  )

  const [url, setURL] = useState<string>('')
  const [previewURL, setPreviewURL] = useState<string>(previewURLFromProps)

  const { isPopupOpen, openPopupWindow, popupRef } = usePopupWindow({
    eventType: 'payload-live-preview',
    url,
  })

  const [appIsReady, setAppIsReady] = useState(false)
  const [listeningForMessages, setListeningForMessages] = useState(false)

  const { collectionSlug, globalSlug } = useDocumentInfo()

  const isFirstRender = useRef(true)

  const { setPreference } = usePreferences()

  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const [loadedURL, setLoadedURL] = useState<string>()

  const [zoom, setZoom] = useState(1)

  const [position, setPosition] = useState({ x: 0, y: 0 })

  const [size, setSize] = React.useReducer(sizeReducer, { height: 0, width: 0 })

  const [measuredDeviceSize, setMeasuredDeviceSize] = useState({
    height: 0,
    width: 0,
  })

  const [breakpoint, setBreakpoint] =
    React.useState<LivePreviewConfig['breakpoints'][0]['name']>('responsive')

  /**
   * A "middleware" callback fn that does some additional work before `setURL`.
   * This is what we provide through context, bc it:
   *  - ensures the URL is absolute
   *  - resets `appIsReady` to `false` while the new URL is loading
   */
  const setLivePreviewURL = useCallback<LivePreviewContextType['setURL']>(
    (_incomingURL) => {
      let incomingURL: LivePreviewURLType

      if (typeof _incomingURL === 'string') {
        incomingURL = formatAbsoluteURL(_incomingURL)
      }

      if (!incomingURL) {
        setIsLivePreviewing(false)
      }

      if (incomingURL !== url) {
        setAppIsReady(false)
        setURL(incomingURL)
      }
    },
    [url],
  )

  /**
   * `url` needs to be relative to the window, which cannot be done on initial render.
   */
  useEffect(() => {
    if (typeof urlFromProps === 'string') {
      setURL(formatAbsoluteURL(urlFromProps))
    }
  }, [urlFromProps])

  // The toolbar needs to freely drag and drop around the page
  const handleDragEnd = (ev) => {
    // only update position if the toolbar is completely within the preview area
    // otherwise reset it back to the previous position
    // TODO: reset to the nearest edge of the preview area
    if (ev.over && ev.over.id === 'live-preview-area') {
      const newPos = {
        x: position.x + ev.delta.x,
        y: position.y + ev.delta.y,
      }

      setPosition(newPos)
    } else {
      // reset
    }
  }

  const setWidth = useCallback(
    (width) => {
      setSize({ type: 'width', value: width })
    },
    [setSize],
  )

  const setHeight = useCallback(
    (height) => {
      setSize({ type: 'height', value: height })
    },
    [setSize],
  )

  // explicitly set new width and height when as new breakpoints are selected
  // exclude `custom` breakpoint as it is handled by the `setWidth` and `setHeight` directly
  useEffect(() => {
    const foundBreakpoint = breakpoints?.find((bp) => bp.name === breakpoint)

    if (
      foundBreakpoint &&
      breakpoint !== 'responsive' &&
      breakpoint !== 'custom' &&
      typeof foundBreakpoint?.width === 'number' &&
      typeof foundBreakpoint?.height === 'number'
    ) {
      setSize({
        type: 'reset',
        value: {
          height: foundBreakpoint.height,
          width: foundBreakpoint.width,
        },
      })
    }
  }, [breakpoint, breakpoints])

  /**
   * Receive the `ready` message from the popup window
   * This indicates that the app is ready to receive `window.postMessage` events
   * This is also the only cross-origin way of detecting when a popup window has loaded
   * Unlike iframe elements which have an `onLoad` handler, there is no way to access `window.open` on popups
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        url?.startsWith(event.origin) &&
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'payload-live-preview'
      ) {
        if (event.data.ready) {
          setAppIsReady(true)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    setListeningForMessages(true)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [url, listeningForMessages])

  const handleWindowChange = useCallback(
    (type: 'iframe' | 'popup') => {
      setAppIsReady(false)
      setPreviewWindowType(type)
      if (type === 'popup') {
        openPopupWindow()
      }
    },
    [openPopupWindow],
  )

  // when the user closes the popup window, switch back to the iframe
  // the `usePopupWindow` reports the `isPopupOpen` state for us to use here
  useEffect(() => {
    const newPreviewWindowType = isPopupOpen ? 'popup' : 'iframe'

    if (newPreviewWindowType !== previewWindowType) {
      handleWindowChange('iframe')
    }
  }, [previewWindowType, isPopupOpen, handleWindowChange])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    void setPreference<CollectionPreferences>(
      collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug}`,
      {
        editViewType: isLivePreviewing ? 'live-preview' : 'default',
      },
      true,
    )
  }, [isLivePreviewing, setPreference, collectionSlug, globalSlug])

  return (
    <LivePreviewContext
      value={{
        appIsReady,
        breakpoint,
        breakpoints,
        iframeRef,
        isLivePreviewEnabled,
        isLivePreviewing,
        isPopupOpen,
        isPreviewEnabled,
        listeningForMessages,
        loadedURL,
        measuredDeviceSize,
        openPopupWindow,
        popupRef,
        previewURL,
        previewWindowType,
        setAppIsReady,
        setBreakpoint,
        setHeight,
        setIsLivePreviewing,
        setLoadedURL,
        setMeasuredDeviceSize,
        setPreviewURL,
        setPreviewWindowType: handleWindowChange,
        setSize,
        setToolbarPosition: setPosition,
        setURL: setLivePreviewURL,
        setWidth,
        setZoom,
        size,
        toolbarPosition: position,
        typeofLivePreviewURL,
        url,
        zoom,
      }}
    >
      <DndContext collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    </LivePreviewContext>
  )
}
