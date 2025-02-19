'use client'
import { useSelection } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { ExportDrawer } from '../ExportDrawer/index.js'
import { useImportExport } from '../ImportExportProvider/index.js'
import './index.scss'

const baseClass = 'export-button'

export const ExportButton: React.FC<{ collectionSlug: string; exportCollectionSlug: string }> = ({
  collectionSlug,
  exportCollectionSlug,
}) => {
  const exportDrawerSlug = `export-${collectionSlug}`
  const { selected } = useSelection()
  const { setCollection, setSelected } = useImportExport()

  useEffect(() => {
    setSelected(selected)
  }, [selected, setSelected])

  useEffect(() => {
    setCollection(collectionSlug)
  }, [collectionSlug, setCollection])

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
