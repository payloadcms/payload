import type { PayloadServerReactComponent, SanitizedCollectionConfig } from 'payload'

import React from 'react'

const baseClass = 'collection-live-preview-button'

export const CollectionLivePreviewButton: PayloadServerReactComponent<
  SanitizedCollectionConfig['admin']['components']['views']['edit']['livePreview']
> = () => {
  return (
    <div
      className={baseClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <p className="nav__label" style={{ color: 'var(--theme-text)', margin: 0 }}>
        Collection Live Preview Button
      </p>
    </div>
  )
}
