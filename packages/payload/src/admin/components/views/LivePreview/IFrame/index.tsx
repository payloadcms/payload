import React, { forwardRef } from 'react'

import { useLivePreviewContext } from '../Context/context'
import './index.scss'

const baseClass = 'live-preview-iframe'

export const IFrame: React.FC<{
  ref: React.Ref<HTMLIFrameElement>
  setIframeHasLoaded: (value: boolean) => void
  url: string
}> = forwardRef((props, ref) => {
  const { setIframeHasLoaded, url } = props

  const { zoom } = useLivePreviewContext()

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
      title={url}
    />
  )
})
