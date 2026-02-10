'use client'

import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { ListHeader } from '../../../elements/ListHeader/index.js'
import { ListCreateNewButton } from '../../../elements/ListHeader/TitleActions/index.js'
import { Pill } from '../../../elements/Pill/index.js'
import './index.scss'

const baseClass = 'taxonomy-list-header'

export type TaxonomyListHeaderProps = {
  collectionConfig: ClientCollectionConfig
  Description?: React.ReactNode
  hasCreatePermission: boolean
  i18n: I18nClient
  isRootLevel: boolean
  newDocumentURL: string
}

export function TaxonomyListHeader({
  collectionConfig,
  Description,
  hasCreatePermission,
  i18n,
  isRootLevel,
  newDocumentURL,
}: TaxonomyListHeaderProps) {
  const { labels } = collectionConfig

  return (
    <ListHeader
      Actions={
        isRootLevel
          ? [
              <Pill className={`${baseClass}__root-pill`} key="root-pill" pillStyle="light-gray">
                Root
              </Pill>,
            ]
          : undefined
      }
      AfterListHeaderContent={Description}
      className={baseClass}
      title={getTranslation(labels?.plural, i18n)}
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
