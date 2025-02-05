'use client'
import { useModal } from '@payloadcms/ui'
import React from 'react'

import { ExportDrawer } from '../ExportDrawer'
import './index.scss'

const baseClass = 'export-button'
export const ExportButton: React.FC<{ collectionSlug: string; exportCollectionSlug: string }> = ({
  collectionSlug,
  exportCollectionSlug,
}) => {
  const { toggleModal } = useModal()
  const exportDrawerSlug = `export-${collectionSlug}`

  return (
    <React.Fragment>
      <button className={baseClass} onClick={() => toggleModal(exportDrawerSlug)} type="button">
        Export
      </button>
      <ExportDrawer
        collectionSlug={collectionSlug}
        drawerSlug={exportDrawerSlug}
        exportCollectionSlug={exportCollectionSlug}
      />
    </React.Fragment>
  )
}
