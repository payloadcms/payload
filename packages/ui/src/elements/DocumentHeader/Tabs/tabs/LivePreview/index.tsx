import React from 'react'

import { DocumentTabProps } from 'payload/types'
import { DocumentTab } from '../../Tab'

export const LivePreviewTab: React.FC<DocumentTabProps> = ({
  collectionConfig,
  globalConfig,
  config,
  i18n,
}) => {
  const { t } = i18n

  let passesCondition = false

  if (collectionConfig) {
    passesCondition = Boolean(
      config?.admin?.livePreview?.collections?.includes(collectionConfig.slug) ||
        collectionConfig?.admin?.livePreview,
    )
  }

  if (globalConfig) {
    passesCondition = Boolean(
      config?.admin?.livePreview?.globals?.includes(globalConfig.slug) ||
        globalConfig?.admin?.livePreview,
    )
  }

  if (!passesCondition) {
    return null
  }

  return (
    <DocumentTab href="/preview" label={t('general:livePreview')} config={config} i18n={i18n} />
  )
}
