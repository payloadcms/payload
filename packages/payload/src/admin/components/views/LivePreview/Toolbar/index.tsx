import { useDraggable } from '@dnd-kit/core'
import React from 'react'

import type { LivePreviewViewProps } from '..'
import type { usePopupWindow } from '../usePopupWindow'

import DragHandle from '../../../icons/Drag'
import LinkIcon from '../../../icons/Link'
import './index.scss'
const baseClass = 'live-preview-toolbar'

export const LivePreviewToolbar: React.FC<
  LivePreviewViewProps & {
    iframeRef?: React.RefObject<HTMLIFrameElement>
    popupState: ReturnType<typeof usePopupWindow>
    style?: React.CSSProperties
    url?: string
  }
> = (props) => {
  const {
    popupState: { openPopupWindow },
    style,
    url,
  } = props
  const [zoom, setZoom] = React.useState(100)
  const [breakpoint, setBreakpoint] = React.useState('responsive')

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'live-preview-toolbar',
  })

  return (
    <div
      className={baseClass}
      style={{
        ...style,
        transform: transform
          ? `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`
          : undefined,
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
      <select
        className={`${baseClass}__breakpoint`}
        onChange={(e) => setBreakpoint(e.target.value)}
        value={breakpoint}
      >
        <option>Responsive</option>
      </select>
      <input
        className={`${baseClass}__zoom`}
        onChange={(e) => setZoom(Number(e.target.value))}
        type="number"
        value={zoom}
      />
      <a href={url} onClick={openPopupWindow} type="button">
        <LinkIcon />
      </a>
    </div>
  )
}
