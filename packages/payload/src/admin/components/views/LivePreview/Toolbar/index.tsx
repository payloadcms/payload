import { useDraggable } from '@dnd-kit/core'
import React from 'react'

import type { ToolbarProviderProps } from '../ToolbarProvider'

import { X } from '../../..'
import { ExternalLinkIcon } from '../../../graphics/ExternalLink'
import DragHandle from '../../../icons/Drag'
import './index.scss'
const baseClass = 'live-preview-toolbar'

export const LivePreviewToolbar: React.FC<
  ToolbarProviderProps & {
    iframeRef: React.RefObject<HTMLIFrameElement>
    style?: React.CSSProperties
  }
> = (props) => {
  const {
    breakpoint,
    breakpoints,
    deviceSize,
    popupState: { openPopupWindow },
    setBreakpoint,
    style,
    url,
  } = props

  const [zoom, setZoom] = React.useState(100)

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
      <div className={`${baseClass}__controls`}>
        {breakpoints?.length > 0 && (
          <select
            className={`${baseClass}__breakpoint`}
            onChange={(e) => setBreakpoint(e.target.value)}
            value={breakpoint}
          >
            {breakpoints.map((bp) => (
              <option key={bp.name} value={bp.name}>
                {bp.label}
              </option>
            ))}
          </select>
        )}
        <div className={`${baseClass}__device-size`}>
          <input
            className={`${baseClass}__size`}
            disabled
            type="number"
            value={deviceSize?.width.toFixed(0)}
          />
          <span className={`${baseClass}__size-divider`}>
            <X />
          </span>
          <input
            className={`${baseClass}__size`}
            disabled
            type="number"
            value={deviceSize?.height.toFixed(0)}
          />
        </div>
        <select
          className={`${baseClass}__zoom`}
          onChange={(e) => setZoom(Number(e.target.value))}
          value={zoom}
        >
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
        </select>
        <a className={`${baseClass}__external`} href={url} onClick={openPopupWindow} type="button">
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  )
}
