'use client'
import React from 'react'

import { useLivePreviewContext } from '../Context/context.js'
import './index.scss'

const baseClass = 'live-preview-iframe'

type Props = {
  ref: React.RefObject<HTMLIFrameElement>
  setIframeHasLoaded: (value: boolean) => void
  url: string
}

export const IFrame: React.FC<Props> = (props) => {
  const { ref, setIframeHasLoaded, url } = props

  const { zoom } = useLivePreviewContext()

  const getAbsoluteUrl = (url: string) => {
    try {
      return new URL(url, window.location.origin).href
    } catch {
      return url
    }
  }

  const formattedUrl =
    url.startsWith('http://') || url.startsWith('https://') ? url : getAbsoluteUrl(url)

  return (
    <iframe
      className={baseClass}
      onLoad={() => {
        setIframeHasLoaded(true)
      }}
      ref={ref}
      src={url}
      style={{
        transform: typeof zoom === 'number' ? `scale(${zoom}) ` : undefined,
      }}
      title={formattedUrl}
    />
  )
}
