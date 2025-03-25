'use client'

import type { I18nClient, TFunction } from '@payloadcms/translations'
import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { Button } from '../../Button/index.js'

const baseClass = 'list-header'

type DefaultTitleActionsProps = {
  collectionConfig: ClientCollectionConfig
  hasCreatePermission: boolean
  i18n: I18nClient
  isBulkUploadEnabled: boolean
  newDocumentURL: string
  openBulkUpload: () => void
  t: TFunction
}

export const DefaultTitleActions = ({
  collectionConfig,
  hasCreatePermission,
  i18n,
  isBulkUploadEnabled,
  newDocumentURL,
  openBulkUpload,
  t,
}: DefaultTitleActionsProps): React.ReactNode[] => {
  const Actions: React.ReactNode[] = []

  if (hasCreatePermission) {
    Actions.push(
      <Button
        aria-label={i18n.t('general:createNewLabel', {
          label: getTranslation(collectionConfig?.labels?.singular, i18n),
        })}
        buttonStyle="pill"
        className={`${baseClass}__create-new-button`}
        el={'link'}
        key="create-new-button"
        size="small"
        to={newDocumentURL}
      >
        {i18n.t('general:createNew')}
      </Button>,
    )
  }

  if (hasCreatePermission && isBulkUploadEnabled) {
    Actions.push(
      <Button
        aria-label={t('upload:bulkUpload')}
        buttonStyle="pill"
        key="bulk-upload-button"
        onClick={openBulkUpload}
        size="small"
      >
        {t('upload:bulkUpload')}
      </Button>,
    )
  }

  return Actions
}
