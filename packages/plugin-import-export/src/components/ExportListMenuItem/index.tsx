'use client'

import { getTranslation } from '@ruya.sa/translations'
import {
  PopupList,
  Translation,
  useConfig,
  useDocumentDrawer,
  useDocumentInfo,
  useTranslation,
} from '@ruya.sa/ui'
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

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: exportCollectionSlug,
  })
  const { setCollection } = useImportExport()

  // Set collection and selected items on mount or when selection changes
  useEffect(() => {
    setCollection(currentCollectionConfig.slug ?? '')
  }, [currentCollectionConfig, setCollection])

  return (
    <PopupList.Button className={baseClass}>
      <DocumentDrawerToggler>
        <Translation
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          i18nKey="plugin-import-export:exportDocumentLabel"
          t={t}
          variables={{
            label: getTranslation(currentCollectionConfig.labels.plural, i18n),
          }}
        />
      </DocumentDrawerToggler>
      <DocumentDrawer />
    </PopupList.Button>
  )
}
