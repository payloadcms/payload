import React from 'react'

import type { LivePreviewViewProps } from '..'

import DragHandle from '../../../icons/Drag'
import LinkIcon from '../../../icons/Link'
import './index.scss'

const baseClass = 'live-preview-toolbar'

export const LivePreviewToolbar: React.FC<
  LivePreviewViewProps & {
    toggleWindow?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
    url?: string
  }
> = (props) => {
  const { toggleWindow, url } = props

  return (
    <div
      className={[baseClass, toggleWindow && `${baseClass}--detached`].filter(Boolean).join(' ')}
    >
      <DragHandle />
      <span>Responsive</span>
      <span>100%</span>
      <a
        href={url}
        onClick={(e) => {
          toggleWindow(e)
        }}
        type="button"
      >
        <LinkIcon />
      </a>
    </div>
  )
}
