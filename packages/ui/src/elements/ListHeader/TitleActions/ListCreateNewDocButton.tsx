'use client'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'

const baseClass = 'list-create-new-doc'

export function ListCreateNewButton({
  collectionConfig,
  hasCreatePermission,
  newDocumentURL,
}: {
  collectionConfig: ClientCollectionConfig
  hasCreatePermission: boolean
  newDocumentURL: string
}) {
  const { i18n, t } = useTranslation()

  if (!hasCreatePermission) {
    return null
  }

  return (
    <Button
      aria-label={t('general:createNewLabel', {
        label: getTranslation(collectionConfig?.labels?.singular, i18n),
      })}
      buttonStyle="pill"
      className={`${baseClass}__create-new-button`}
      el={'link'}
      key="create-new-button"
      size="small"
      to={newDocumentURL}
    >
      {t('general:createNew')}
    </Button>
  )
}
