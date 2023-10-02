import { DndContext } from '@dnd-kit/core'
import React, { useCallback, useEffect } from 'react'

import type { usePopupWindow } from '../usePopupWindow'

import { EditViewProps } from '../../types'
import { LivePreviewContext } from './context'
import { customCollisionDetection } from './collisionDetection'
import { LivePreview } from '../../../../../exports/config'
import { useResize } from '../../../../utilities/useResize'
import { sizeReducer } from './sizeReducer'

export type ToolbarProviderProps = EditViewProps & {
  breakpoints?: LivePreview['breakpoints']
  deviceSize?: {
    height: number
    width: number
  }
  popupState: ReturnType<typeof usePopupWindow>
  url?: string
  children: React.ReactNode
}

export const LivePreviewProvider: React.FC<ToolbarProviderProps> = (props) => {
  const { children, breakpoints } = props

  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const deviceFrameRef = React.useRef<HTMLDivElement>(null)

  const [iframeHasLoaded, setIframeHasLoaded] = React.useState(false)

  const [zoom, setZoom] = React.useState(1)

  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const [size, setSize] = React.useReducer(sizeReducer, { width: 0, height: 0 })

  const [breakpoint, setBreakpoint] =
    React.useState<LivePreview['breakpoints'][0]['name']>('responsive')

  const foundBreakpoint = breakpoint && breakpoints.find((bp) => bp.name === breakpoint)

  let margin = '0'

  if (foundBreakpoint && breakpoint !== 'responsive') {
    margin = '0 auto'

    if (
      typeof zoom === 'number' &&
      typeof foundBreakpoint.width === 'number' &&
      typeof foundBreakpoint.height === 'number'
    ) {
      // keep it centered horizontally
      margin = `0 ${foundBreakpoint.width / 2 / zoom}px`
    }
  }

  let url

  if ('collection' in props) {
    url = props?.collection.admin.livePreview.url
  }

  if ('global' in props) {
    url = props?.global.admin.livePreview.url
  }

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

  const { size: actualDeviceSize } = useResize(deviceFrameRef)

  useEffect(() => {
    if (actualDeviceSize) {
      setSize({
        type: 'reset',
        value: {
          width: Number(actualDeviceSize.width.toFixed(0)),
          height: Number(actualDeviceSize.height.toFixed(0)),
        },
      })
    }
  }, [actualDeviceSize])

  return (
    <LivePreviewContext.Provider
      value={{
        zoom,
        setZoom,
        size,
        setWidth,
        setHeight,
        setSize,
        breakpoint,
        iframeRef,
        deviceFrameRef,
        iframeHasLoaded,
        setIframeHasLoaded,
        toolbarPosition: position,
        setToolbarPosition: setPosition,
        breakpoints,
        setBreakpoint,
      }}
    >
      <DndContext collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    </LivePreviewContext.Provider>
  )
}
