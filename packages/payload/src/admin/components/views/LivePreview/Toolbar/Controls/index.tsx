import React from 'react'

import type { EditViewProps } from '../../../types'

import { X } from '../../../..'
import { ExternalLinkIcon } from '../../../../graphics/ExternalLink'
import { useLivePreviewContext } from '../../Context/context'
import { PreviewFrameSizeInput } from '../SizeInput'
import './index.scss'

const baseClass = 'live-preview-toolbar-controls'

export const ToolbarControls: React.FC<EditViewProps> = () => {
  const { breakpoint, breakpoints, setBreakpoint, setPreviewWindowType, setZoom, url, zoom } =
    useLivePreviewContext()

  return (
    <div className={baseClass}>
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
      <a
        className={`${baseClass}__external`}
        href={url}
        onClick={(e) => {
          e.preventDefault()
          setPreviewWindowType('popup')
        }}
        type="button"
      >
        <ExternalLinkIcon />
      </a>
    </div>
  )
}
