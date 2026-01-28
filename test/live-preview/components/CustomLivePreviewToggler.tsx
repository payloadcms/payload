'use client'

import { useLivePreviewContext } from '@payloadcms/ui'

export function CustomLivePreviewToggler() {
  const { isLivePreviewing, setIsLivePreviewing, url: livePreviewURL } = useLivePreviewContext()

  if (!livePreviewURL) {
    return null
  }

  return (
    <button
      className="custom-live-preview-toggler"
      data-testid="custom-live-preview-toggler"
      id="custom-live-preview-toggler"
      onClick={() => {
        setIsLivePreviewing(!isLivePreviewing)
      }}
      type="button"
    >
      {isLivePreviewing ? '🔴 Exit Custom Live Preview' : '🟢 Enter Custom Live Preview'}
    </button>
  )
}
