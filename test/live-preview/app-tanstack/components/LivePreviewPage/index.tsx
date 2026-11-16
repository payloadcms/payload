import { useLivePreview } from '@payloadcms/live-preview-react'
import React from 'react'

export const LivePreviewPage: React.FC<{
  initialData: null | Record<string, unknown>
}> = ({ initialData }) => {
  const { data } = useLivePreview<Record<string, unknown>>({
    depth: 2,
    initialData: initialData ?? {},
    serverURL: typeof window === 'undefined' ? '' : window.location.origin,
  })

  const title = data?.title as string | undefined

  return (
    <div>
      <div id="rendered-page-title">{`For Testing: ${title ?? ''}`}</div>
    </div>
  )
}
