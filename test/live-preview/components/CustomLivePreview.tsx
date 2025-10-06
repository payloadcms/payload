'use client'
import { LivePreviewWindow, useDocumentInfo, useLivePreviewContext } from '@payloadcms/ui'

import './styles.css'

export function CustomLivePreview() {
  const { collectionSlug, globalSlug } = useDocumentInfo()
  const { isLivePreviewing, setURL, url } = useLivePreviewContext()

  return (
    <div
      className={[
        'custom-live-preview',
        isLivePreviewing && `custom-live-preview--is-live-previewing`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLivePreviewing && (
        <>
          <p>Custom live preview being rendered</p>
          <LivePreviewWindow collectionSlug={collectionSlug} globalSlug={globalSlug} />
        </>
      )}
    </div>
  )
}
