import React from 'react'

import type { LivePreviewViewProps } from '..'

import DragHandle from '../../../icons/Drag'
import LinkIcon from '../../../icons/Link'
import './index.scss'

const baseClass = 'live-preview-toolbar'

export const LivePreviewToolbar: React.FC<
  LivePreviewViewProps & {
    openPopupWindow?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
    url?: string
  }
> = (props) => {
  const { openPopupWindow, url } = props

  return (
    <div className={[baseClass].filter(Boolean).join(' ')}>
      <DragHandle />
      <span>Responsive</span>
      <span>100%</span>
      <a href={url} onClick={openPopupWindow} type="button">
        <LinkIcon />
      </a>
    </div>
  )
}
