import React, { forwardRef } from 'react'
import { useLivePreviewContext } from '../PreviewContext/context'

import './index.scss'

const baseClass = 'live-preview-iframe'

export const IFrame: React.FC<{
  url: string
  ref: React.Ref<HTMLIFrameElement>
  setIframeHasLoaded: (value: boolean) => void
}> = forwardRef((props, ref) => {
  const { url, setIframeHasLoaded } = props

  const { zoom } = useLivePreviewContext()

  return (
    <iframe
      className={baseClass}
      onLoad={() => {
        setIframeHasLoaded(true)
      }}
      ref={ref}
      src={url}
      title={url}
      style={{
        transform: typeof zoom === 'number' ? `scale(${zoom}) ` : undefined,
      }}
    />
  )
})
