import React, { forwardRef } from 'react'
import './index.scss'
import { useLivePreviewToolbarContext } from '../ToolbarProvider/context'

const baseClass = 'live-preview-iframe'

export const IFrame: React.FC<{
  url: string
  ref: React.Ref<HTMLIFrameElement>
  setIframeHasLoaded: (value: boolean) => void
}> = forwardRef((props, ref) => {
  const { url, setIframeHasLoaded } = props

  const context = useLivePreviewToolbarContext()

  return (
    <iframe
      className={baseClass}
      onLoad={() => {
        setIframeHasLoaded(true)
      }}
      ref={ref}
      src={url}
      title={url}
    />
  )
})
