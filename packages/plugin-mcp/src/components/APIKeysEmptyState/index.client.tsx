'use client'

import type { NoResultsClientProps } from 'payload'

import { Button, NoListResults, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type {
  PluginMCPTranslationKeys,
  PluginMCPTranslations,
} from '../../translations/index.js'

export const APIKeysEmptyState: React.FC<NoResultsClientProps> = ({
  hasCreatePermission,
  newDocumentURL,
  viewType,
}) => {
  const { t } = useTranslation<PluginMCPTranslations, PluginMCPTranslationKeys>()

  return (
    <NoListResults
      Actions={
        hasCreatePermission && newDocumentURL && viewType !== 'trash'
          ? [
              <Button el="link" key="create" to={newDocumentURL}>
                {t('authentication:generateNewAPIKey')}
              </Button>,
            ]
          : []
      }
      description={t('plugin-mcp:apiKeyDescription')}
      title={t('plugin-mcp:noAPIKeys')}
      withMargin
    />
  )
}
