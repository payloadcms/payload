'use client'
import React from 'react'

import { useLivePreviewContext } from '../../../providers/LivePreview/context.js'
import './index.scss'

const baseClass = 'live-preview-iframe'

export const IFrame: React.FC = () => {
  const { iframeRef, setLoadedURL, url, zoom } = useLivePreviewContext()

  return (
    <iframe
      className={baseClass}
      key={url}
      onLoad={() => {
        setLoadedURL(url)
      }}
      ref={iframeRef}
      src={url}
      style={{
        transform: typeof zoom === 'number' ? `scale(${zoom}) ` : undefined,
      }}
      title={url}
    />
  )
}
