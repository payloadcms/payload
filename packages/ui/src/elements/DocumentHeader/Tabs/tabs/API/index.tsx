import React from 'react'

import { DocumentTabProps } from 'payload/types'
import { DocumentTab } from '../../Tab'

export const APITab: React.FC<DocumentTabProps> = ({
  collectionConfig,
  globalConfig,
  config,
  i18n,
}) => {
  if (
    (collectionConfig && collectionConfig?.admin?.hideAPIURL) ||
    (globalConfig && globalConfig?.admin?.hideAPIURL)
  ) {
    return null
  }

  return (
    <DocumentTab
      href="/api"
      label="API"
      config={config}
      i18n={i18n}
      collectionConfig={collectionConfig}
      globalConfig={globalConfig}
    />
  )
}
