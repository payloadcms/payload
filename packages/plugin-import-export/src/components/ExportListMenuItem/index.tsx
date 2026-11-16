'use client'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useDocumentDrawer, useTranslation } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'export-list-menu-item'

export const ExportListMenuItem: React.FC<{
  collectionSlug: string
  exportCollectionSlug: string
}> = ({ collectionSlug, exportCollectionSlug }) => {
  const { getEntityConfig } = useConfig()

  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  const currentCollectionConfig = getEntityConfig({ collectionSlug })
  const collectionLabel = getTranslation(currentCollectionConfig.labels.plural, i18n)
  const actionLabel = t('plugin-import-export:exportDocumentLabel', {
    label: collectionLabel,
  })

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: exportCollectionSlug,
  })
  const { setCollection } = useImportExport()

  // Set collection and selected items on mount or when selection changes
  useEffect(() => {
    setCollection(currentCollectionConfig.slug ?? '')
  }, [currentCollectionConfig, setCollection])

  return (
    <>
      <DocumentDrawerToggler
        aria-label={actionLabel}
        className={`popup-button-list__button ${baseClass}`}
        role="menuitem"
        tabIndex={-1}
      >
        <span className="popup-button-list__label">{actionLabel}</span>
      </DocumentDrawerToggler>
      <DocumentDrawer initialData={{ collectionSlug }} />
    </>
  )
}
