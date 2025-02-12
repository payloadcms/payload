'use client'

import { useConfig, useDocumentDrawer, useSelection } from '@payloadcms/ui'

import './index.scss'

import React, { Fragment, useEffect } from 'react'

import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'export-drawer'

export const ExportDrawer: React.FC<{
  collectionSlug: string
  drawerSlug: string
  exportCollectionSlug: string
}> = ({ collectionSlug, exportCollectionSlug }) => {
  const { getEntityConfig } = useConfig()
  const currentCollectionConfig = getEntityConfig({ collectionSlug })

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: exportCollectionSlug,
  })
  const { setCollection } = useImportExport()

  useEffect(() => {
    setCollection(currentCollectionConfig.slug ?? '')
  }, [currentCollectionConfig, setCollection])

  const selectedDocs = []
  const selection = useSelection()
  selection.selected.forEach((value, key) => {
    if (value === true) {
      selectedDocs.push(key)
    }
  })

  return (
    <Fragment>
      <DocumentDrawerToggler>Export</DocumentDrawerToggler>
      <DocumentDrawer />
    </Fragment>
  )
}
