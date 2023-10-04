import { DndContext } from '@dnd-kit/core'
import React, { useCallback, useEffect } from 'react'

import type { LivePreview } from '../../../../../exports/config'
import type { EditViewProps } from '../../types'
import type { usePopupWindow } from '../usePopupWindow'

import { useResize } from '../../../../utilities/useResize'
import { customCollisionDetection } from './collisionDetection'
import { LivePreviewContext } from './context'
import { sizeReducer } from './sizeReducer'

export type ToolbarProviderProps = EditViewProps & {
  breakpoints?: LivePreview['breakpoints']
  children: React.ReactNode
  deviceSize?: {
    height: number
    width: number
  }
  popupState: ReturnType<typeof usePopupWindow>
  url?: string
}

export const LivePreviewProvider: React.FC<ToolbarProviderProps> = (props) => {
  const { breakpoints, children } = props

  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const deviceFrameRef = React.useRef<HTMLDivElement>(null)

  const [iframeHasLoaded, setIframeHasLoaded] = React.useState(false)

  const [zoom, setZoom] = React.useState(1)

  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const [size, setSize] = React.useReducer(sizeReducer, { height: 0, width: 0 })

  const [breakpoint, setBreakpoint] =
    React.useState<LivePreview['breakpoints'][0]['name']>('responsive')

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

  // keep an accurate measurement of the actual device size as it is truly rendered
  // this is helpful when `sizes` are non-number units like percentages, etc.
  const { size: measuredDeviceSize } = useResize(deviceFrameRef)

  return (
    <LivePreviewContext.Provider
      value={{
        breakpoint,
        breakpoints,
        deviceFrameRef,
        iframeHasLoaded,
        iframeRef,
        measuredDeviceSize,
        setBreakpoint,
        setHeight,
        setIframeHasLoaded,
        setSize,
        setToolbarPosition: setPosition,
        setWidth,
        setZoom,
        size,
        toolbarPosition: position,
        zoom,
      }}
    >
      <DndContext collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    </LivePreviewContext.Provider>
  )
}
