'use client'
import { useSelection } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { ExportDrawer } from '../ExportDrawer/index.js'
import './index.scss'
import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'export-button'
export const ExportButton: React.FC<{ collectionSlug: string; exportCollectionSlug: string }> = ({
  collectionSlug,
  exportCollectionSlug,
}) => {
  const exportDrawerSlug = `export-${collectionSlug}`
  const { selected } = useSelection()
  const { setSelected } = useImportExport()

  useEffect(() => {
    setSelected(selected)
  }, [selected, setSelected])

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
