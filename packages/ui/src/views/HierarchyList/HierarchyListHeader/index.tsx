'use client'

import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { CollectionOption } from '../../../elements/CreateDocumentButton/index.js'

import { CreateDocumentButton } from '../../../elements/CreateDocumentButton/index.js'
import { ListHeader } from '../../../elements/ListHeader/index.js'
import { useRouteCache } from '../../../providers/RouteCache/index.js'
import { DocumentListSelection } from '../DocumentListSelection/index.js'
import './index.scss'

const baseClass = 'hierarchy-list-header'

export type HierarchyListHeaderProps = {
  collectionConfig: ClientCollectionConfig
  /** Collections available for creation with their initial data */
  collections: CollectionOption[]
  /** Title to display - defaults to collection label if not provided */
  currentItemTitle?: string
  Description?: React.ReactNode
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  hasCreatePermission: boolean
  i18n: I18nClient
}

export function HierarchyListHeader({
  collectionConfig,
  collections,
  currentItemTitle,
  Description,
  disableBulkDelete,
  disableBulkEdit,
  hasCreatePermission,
  i18n,
}: HierarchyListHeaderProps) {
  const { labels } = collectionConfig
  const title = currentItemTitle || getTranslation(labels?.plural, i18n)
  const { clearRouteCache } = useRouteCache()

  return (
    <ListHeader
      Actions={[
        <DocumentListSelection
          disableBulkDelete={disableBulkDelete}
          disableBulkEdit={disableBulkEdit}
          key="document-list-selection"
          taxonomySlug={collectionConfig.slug}
        />,
      ]}
      AfterListHeaderContent={Description}
      className={baseClass}
      title={title}
      TitleActions={
        hasCreatePermission && collections.length > 0
          ? [
              <CreateDocumentButton
                collections={collections}
                drawerSlug={`taxonomy-create-${collectionConfig.slug}`}
                key="taxonomy-create-button"
                onSave={clearRouteCache}
              />,
            ]
          : undefined
      }
    />
  )
}
