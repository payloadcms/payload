import { useDraggable } from '@dnd-kit/core'
import React from 'react'

import type { ToolbarProviderProps } from '../Context'

import { X } from '../../..'
import { ExternalLinkIcon } from '../../../graphics/ExternalLink'
import DragHandle from '../../../icons/Drag'
import { useLivePreviewContext } from '../Context/context'
import { PreviewFrameSizeInput } from './SizeInput'
import './index.scss'

const baseClass = 'live-preview-toolbar'

export const LivePreviewToolbar: React.FC<
  Omit<ToolbarProviderProps, 'children'> & {
    iframeRef: React.RefObject<HTMLIFrameElement>
    style?: React.CSSProperties
  }
> = (props) => {
  const {
    popupState: { openPopupWindow },
    style,
    url,
  } = props

  const { breakpoint, breakpoints, setBreakpoint, setZoom, zoom } = useLivePreviewContext()

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
            {breakpoint === 'custom' && (
              // Dynamically add this option so that it only appears when the width and height inputs are explicitly changed
              // TODO: Translate this string
              <option value="custom">Custom</option>
            )}
          </select>
        )}
        <div className={`${baseClass}__device-size`}>
          <PreviewFrameSizeInput axis="x" />
          <span className={`${baseClass}__size-divider`}>
            <X />
          </span>
          <PreviewFrameSizeInput axis="y" />
        </div>
        <select
          className={`${baseClass}__zoom`}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          value={zoom * 100}
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
