import { useDraggable } from '@dnd-kit/core'
import React from 'react'

import type { ToolbarProviderProps } from '../Context'

import DragHandle from '../../../icons/Drag'
import { useLivePreviewContext } from '../Context/context'
import { ToolbarControls } from './Controls'
import './index.scss'

const baseClass = 'live-preview-toolbar'

export type LivePreviewToolbarProps = Omit<ToolbarProviderProps, 'children'> & {
  iframeRef: React.RefObject<HTMLIFrameElement>
}

const DraggableToolbar: React.FC<LivePreviewToolbarProps> = (props) => {
  const { toolbarPosition } = useLivePreviewContext()

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'live-preview-toolbar',
  })

  return (
    <div
      className={[baseClass, `${baseClass}--draggable`].join(' ')}
      style={{
        left: `${toolbarPosition.x}px`,
        top: `${toolbarPosition.y}px`,
        ...(transform
          ? {
              transform: transform
                ? `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`
                : undefined,
            }
          : {}),
      }}
    >
      <button
        {...listeners}
        {...attributes}
        className={`${baseClass}__drag-handle`}
        ref={setNodeRef}
        type="button"
      >
        <DragHandle />
      </button>
      <ToolbarControls {...props} />
    </div>
  )
}

const StaticToolbar: React.FC<LivePreviewToolbarProps> = (props) => {
  return (
    <div className={[baseClass, `${baseClass}--static`].join(' ')}>
      <ToolbarControls {...props} />
    </div>
  )
}

export const LivePreviewToolbar: React.FC<
  LivePreviewToolbarProps & {
    draggable?: boolean
  }
> = (props) => {
  const { draggable } = props

  if (draggable) {
    return <DraggableToolbar {...props} />
  }

  return <StaticToolbar {...props} />
}
