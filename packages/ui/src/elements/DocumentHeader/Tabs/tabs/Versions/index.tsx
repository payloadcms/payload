import React from 'react'

import { DocumentTabProps } from 'payload/types'
import { DocumentTab } from '../../Tab'
import { VersionPill } from './Pill'

export const VersionsTab: React.FC<DocumentTabProps> = ({
  collectionConfig,
  globalConfig,
  config,
  i18n,
}) => {
  const { t } = i18n

  if (!Boolean(collectionConfig?.versions || globalConfig?.versions)) {
    return null
  }

  return (
    <DocumentTab
      href="/versions"
      label={t('version:versions')}
      Pill={<VersionPill />}
      config={config}
      i18n={i18n}
      collectionConfig={collectionConfig}
      globalConfig={globalConfig}
    />
  )
}
