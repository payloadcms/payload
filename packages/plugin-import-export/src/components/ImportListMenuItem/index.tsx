'use client'

import { getTranslation } from '@payloadcms/translations'
import {
  PopupList,
  Translation,
  useConfig,
  useDocumentDrawer,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import type {
  PluginImportExportTranslationKeys,
  PluginImportExportTranslations,
} from '../../translations/index.js'

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

  return (
    <PopupList.Button className={baseClass}>
      <DocumentDrawerToggler>
        <Translation
          // @ts-expect-error - this is not correctly typed in plugins right now
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
