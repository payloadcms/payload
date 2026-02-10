'use client'

import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { ListHeader } from '../../../elements/ListHeader/index.js'
import { ListCreateNewButton } from '../../../elements/ListHeader/TitleActions/index.js'
import { DocumentListSelection } from '../DocumentListSelection/index.js'
import './index.scss'

const baseClass = 'taxonomy-list-header'

export type TaxonomyListHeaderProps = {
  collectionConfig: ClientCollectionConfig
  /** Title to display - defaults to collection label if not provided */
  currentItemTitle?: string
  Description?: React.ReactNode
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  hasCreatePermission: boolean
  i18n: I18nClient
  isRootLevel: boolean
  newDocumentURL: string
}

export function TaxonomyListHeader({
  collectionConfig,
  currentItemTitle,
  Description,
  disableBulkDelete,
  disableBulkEdit,
  hasCreatePermission,
  i18n,
  isRootLevel,
  newDocumentURL,
}: TaxonomyListHeaderProps) {
  const { labels } = collectionConfig
  const title = currentItemTitle || getTranslation(labels?.plural, i18n)

  return (
    <ListHeader
      Actions={[
        <DocumentListSelection
          disableBulkDelete={disableBulkDelete}
          disableBulkEdit={disableBulkEdit}
          key="document-list-selection"
        />,
      ]}
      AfterListHeaderContent={Description}
      className={baseClass}
      title={title}
      TitleActions={
        hasCreatePermission && newDocumentURL
          ? [
              <ListCreateNewButton
                collectionConfig={collectionConfig}
                hasCreatePermission={hasCreatePermission}
                key="list-header-create-new-doc"
                newDocumentURL={newDocumentURL}
              />,
            ]
          : undefined
      }
    />
  )
}
