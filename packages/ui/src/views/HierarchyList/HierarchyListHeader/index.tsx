'use client'

import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { DefaultListViewTabs } from '../../../elements/DefaultListViewTabs/index.js'
import { ListHeader } from '../../../elements/ListHeader/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { DocumentListSelection } from '../DocumentListSelection/index.js'
import './index.scss'

const baseClass = 'hierarchy-list-header'

export type HierarchyListHeaderProps = {
  collectionConfig: ClientCollectionConfig
  /** Title to display - defaults to collection label if not provided */
  currentItemTitle?: string
  Description?: React.ReactNode
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  /** Icon to display in the move drawer */
  HierarchyIcon?: React.ReactNode
  i18n: I18nClient
  viewType?: ViewTypes
}

export function HierarchyListHeader({
  collectionConfig,
  currentItemTitle,
  Description,
  disableBulkDelete,
  disableBulkEdit,
  HierarchyIcon,
  i18n,
  viewType,
}: HierarchyListHeaderProps) {
  const { config } = useConfig()
  const { labels } = collectionConfig
  const title = currentItemTitle || getTranslation(labels?.plural, i18n)

  return (
    <ListHeader
      Actions={[
        <DocumentListSelection
          disableBulkDelete={disableBulkDelete}
          disableBulkEdit={disableBulkEdit}
          hierarchyIcon={HierarchyIcon}
          hierarchySlug={collectionConfig.slug}
          key="document-list-selection"
        />,
        <DefaultListViewTabs
          collectionConfig={collectionConfig}
          config={config}
          key="default-list-actions"
          viewType={viewType}
        />,
      ]}
      AfterListHeaderContent={Description}
      className={baseClass}
      title={title}
    />
  )
}
