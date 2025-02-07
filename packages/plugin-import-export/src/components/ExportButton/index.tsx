'use client'
import { useModal } from '@payloadcms/ui'
import React from 'react'

import { ExportDrawer } from '../ExportDrawer/index.js'
import './index.scss'

const baseClass = 'export-button'
export const ExportButton: React.FC<{ collectionSlug: string; exportCollectionSlug: string }> = ({
  collectionSlug,
  exportCollectionSlug,
}) => {
  const exportDrawerSlug = `export-${collectionSlug}`

  return (
    <React.Fragment>
      <ExportDrawer
        collectionSlug={collectionSlug}
        drawerSlug={exportDrawerSlug}
        exportCollectionSlug={exportCollectionSlug}
      />
    </React.Fragment>
  )
}
