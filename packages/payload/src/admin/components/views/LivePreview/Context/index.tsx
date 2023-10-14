import { DndContext } from '@dnd-kit/core'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { LivePreviewConfig } from '../../../../../exports/config'
import type { Field } from '../../../../../fields/config/types'
import type { EditViewProps } from '../../types'
import type { usePopupWindow } from '../usePopupWindow'

import { fieldSchemaToJSON } from '../../../../../utilities/fieldSchemaToJSON'
import { customCollisionDetection } from './collisionDetection'
import { LivePreviewContext } from './context'
import { sizeReducer } from './sizeReducer'

export type LivePreviewProviderProps = EditViewProps & {
  appIsReady?: boolean
  breakpoints?: LivePreviewConfig['breakpoints']
  children: React.ReactNode
  deviceSize?: {
    height: number
    width: number
  }
  isPopupOpen?: boolean
  openPopupWindow?: ReturnType<typeof usePopupWindow>['openPopupWindow']
  popupRef?: React.MutableRefObject<Window>
  url?: string
}

export const LivePreviewProvider: React.FC<LivePreviewProviderProps> = (props) => {
  const { breakpoints, children, isPopupOpen, openPopupWindow, popupRef, url } = props

  const [previewWindowType, setPreviewWindowType] = useState<'iframe' | 'popup'>('iframe')

  const [appIsReady, setAppIsReady] = useState(false)

  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const [iframeHasLoaded, setIframeHasLoaded] = useState(false)

  const [zoom, setZoom] = useState(1)

  const [position, setPosition] = useState({ x: 0, y: 0 })

  const [size, setSize] = React.useReducer(sizeReducer, { height: 0, width: 0 })

  const [measuredDeviceSize, setMeasuredDeviceSize] = useState({
    height: 0,
    width: 0,
  })

  const openPopupOnceAppDisabled = useRef(false)

  const [breakpoint, setBreakpoint] =
    React.useState<LivePreviewConfig['breakpoints'][0]['name']>('responsive')

  const [fieldSchemaJSON] = useState(() => {
    let fields: Field[]

    if ('collection' in props) {
      const { collection } = props
      fields = collection.fields
    }

    if ('global' in props) {
      const { global } = props
      fields = global.fields
    }

    return fieldSchemaToJSON(fields)
  })

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

  // Receive the `ready` message from the popup window
  // This indicates that the app is ready to receive `window.postMessage` events
  // This is also the only cross-origin way of detecting when a popup window has loaded
  // Unlike iframe elements which have an `onLoad` handler, there is no way to access `window.open` on popups
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)

      if (url.startsWith(event.origin) && data.type === 'payload-live-preview' && data.ready) {
        setAppIsReady(true)
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [url])

  useEffect(() => {
    if (openPopupOnceAppDisabled.current) {
      openPopupWindow()
      openPopupOnceAppDisabled.current = false
    }
  }, [appIsReady, openPopupWindow])

  const handleWindowChange = useCallback((type: 'iframe' | 'popup') => {
    if (type === 'popup') {
      openPopupOnceAppDisabled.current = true
      setAppIsReady(false)
    }

    setPreviewWindowType(type)
  }, [])

  return (
    <LivePreviewContext.Provider
      value={{
        appIsReady,
        breakpoint,
        breakpoints,
        fieldSchemaJSON,
        iframeHasLoaded,
        iframeRef,
        isPopupOpen,
        measuredDeviceSize,
        openPopupWindow,
        popupRef,
        previewWindowType,
        setAppIsReady,
        setBreakpoint,
        setHeight,
        setIframeHasLoaded,
        setMeasuredDeviceSize,
        setPreviewWindowType: handleWindowChange,
        setSize,
        setToolbarPosition: setPosition,
        setWidth,
        setZoom,
        size,
        toolbarPosition: position,
        url,
        zoom,
      }}
    >
      <DndContext collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    </LivePreviewContext.Provider>
  )
}
