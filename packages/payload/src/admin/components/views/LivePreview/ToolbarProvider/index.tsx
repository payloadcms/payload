import { DndContext } from '@dnd-kit/core'
import React from 'react'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'
import type { usePopupWindow } from '../usePopupWindow'

import { LivePreviewToolbar } from '../Toolbar'
import { ToolbarArea } from '../ToolbarArea'
import { EditViewProps } from '../../types'
import { LivePreviewToolbarContext } from './context'

import './index.scss'
import { customCollisionDetection } from './collisionDetection'

export type ToolbarProviderProps = EditViewProps & {
  breakpoint?: string
  breakpoints?:
    | SanitizedCollectionConfig['admin']['livePreview']['breakpoints']
    | SanitizedGlobalConfig['admin']['livePreview']['breakpoints']
  children: React.ReactNode
  deviceSize?: {
    height: number
    width: number
  }
  popupState: ReturnType<typeof usePopupWindow>
  setBreakpoint?: (breakpoint: string) => void
  url?: string
  iframeRef?: React.MutableRefObject<HTMLIFrameElement>
}

export const LivePreviewToolbarProvider: React.FC<ToolbarProviderProps> = (props) => {
  const { children, iframeRef } = props

  const [zoom, setZoom] = React.useState(1)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

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

  return (
    <LivePreviewToolbarContext.Provider
      value={{
        zoom,
        setZoom,
      }}
    >
      <DndContext collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
        <ToolbarArea>
          {children}
          <div>
            <LivePreviewToolbar
              {...props}
              iframeRef={iframeRef}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
              }}
              url={url}
            />
          </div>
        </ToolbarArea>
      </DndContext>
    </LivePreviewToolbarContext.Provider>
  )
}
