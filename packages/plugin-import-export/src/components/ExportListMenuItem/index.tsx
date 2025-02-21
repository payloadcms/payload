'use client'

import { PopupList, useConfig, useDocumentDrawer, useSelection } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'
import './index.scss'

const baseClass = 'export-list-menu-item'

export const ExportListMenuItem: React.FC<{
  collectionSlug: string
  exportCollectionSlug: string
}> = ({ collectionSlug, exportCollectionSlug }) => {
  const { getEntityConfig } = useConfig()
  const currentCollectionConfig = getEntityConfig({ collectionSlug })

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: exportCollectionSlug,
  })
  const { setCollection, setSelected } = useImportExport()
  const selection = useSelection()

  // Set collection and selected items on mount or when selection changes
  useEffect(() => {
    setCollection(currentCollectionConfig.slug ?? '')
  }, [currentCollectionConfig, setCollection])

  useEffect(() => {
    setSelected(selection.selected)
  }, [selection.selected, setSelected])

  return (
    <PopupList.Button className={baseClass}>
      <DocumentDrawerToggler>Export</DocumentDrawerToggler>
      <DocumentDrawer />
    </PopupList.Button>
  )
}
