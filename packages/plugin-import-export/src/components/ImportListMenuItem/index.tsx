'use client'

import { getTranslation } from '@payloadcms/translations'
import {
  PopupList,
  Translation,
  useConfig,
  useDocumentDrawer,
  useTranslation,
} from '@payloadcms/ui'
import React, { useEffect } from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

import { useImportExport } from '../ImportExportProvider/index.js'

const baseClass = 'import-list-menu-item'

export const ImportListMenuItem: React.FC<{
  collectionSlug: string
  importCollectionSlug: string
}> = ({ collectionSlug, importCollectionSlug }) => {
  const { getEntityConfig } = useConfig()

  const { i18n, t } = useTranslation<
    PluginImportExportTranslations,
    PluginImportExportTranslationKeys
  >()

  const currentCollectionConfig = getEntityConfig({ collectionSlug })

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    collectionSlug: importCollectionSlug,
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
          i18nKey="plugin-import-export:importDocumentLabel"
          t={t}
          variables={{
            label: getTranslation(currentCollectionConfig.labels.plural, i18n),
          }}
        />
      </DocumentDrawerToggler>
      <DocumentDrawer initialData={{ collectionSlug }} />
    </PopupList.Button>
  )
}
