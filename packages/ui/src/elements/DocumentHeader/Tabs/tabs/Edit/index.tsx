import React from 'react'

import { DocumentTabProps } from 'payload/types'
import { DocumentTab } from '../../Tab'

export const EditTab: React.FC<DocumentTabProps> = ({
  collectionConfig,
  globalConfig,
  config,
  i18n,
}) => {
  const { t } = i18n

  return (
    <DocumentTab
      href=""
      label={t('general:edit')}
      config={config}
      i18n={i18n}
      collectionConfig={collectionConfig}
      globalConfig={globalConfig}
    />
  )
}
