import type { CollisionDetection } from '@dnd-kit/core'

import { DndContext, rectIntersection } from '@dnd-kit/core'
import React, { useCallback } from 'react'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'
import type { usePopupWindow } from '../usePopupWindow'

import { LivePreviewToolbar } from '../Toolbar'
import { Droppable } from './Droppable'
import { EditViewProps } from '../../types'
import { LivePreviewToolbarContext } from './context'

import './index.scss'

const baseClass = 'toolbar-area'

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

  // If the toolbar exits the preview area, we need to reset its position
  // This will prevent the toolbar from getting stuck outside the preview area
  const customCollisionDetectionAlgorithm: CollisionDetection = useCallback(
    ({ droppableContainers, ...args }) => {
      const droppableContainer = droppableContainers.find(({ id }) => id === 'live-preview-area')

      const rectIntersectionCollisions = rectIntersection({
        ...args,
        droppableContainers: [droppableContainer],
      })

      // Collision detection algorithms return an array of collisions
      if (rectIntersectionCollisions.length === 0) {
        // The preview area is not intersecting, return early
        return rectIntersectionCollisions
      }

      // Compute whether the draggable element is completely contained within the preview area
      const draggableRect = args.collisionRect
      const previewAreaRect = droppableContainer?.rect?.current

      const isContained =
        draggableRect.top >= previewAreaRect.top &&
        draggableRect.left >= previewAreaRect.left &&
        draggableRect.bottom <= previewAreaRect.bottom &&
        draggableRect.right <= previewAreaRect.right

      if (isContained) {
        return rectIntersectionCollisions
      }
    },
    [],
  )

  return (
    <LivePreviewToolbarContext.Provider
      value={{
        zoom,
        setZoom,
      }}
    >
      <DndContext collisionDetection={customCollisionDetectionAlgorithm} onDragEnd={handleDragEnd}>
        <Droppable>
          {children}
          <div className={`${baseClass}__toolbar-wrapper`}>
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
        </Droppable>
      </DndContext>
    </LivePreviewToolbarContext.Provider>
  )
}
