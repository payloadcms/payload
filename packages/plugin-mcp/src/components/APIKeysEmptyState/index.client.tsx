'use client'

import type { NoResultsClientProps } from 'payload'
import type {
  PluginMCPTranslationKeys,
  PluginMCPTranslations,
} from '../../translations/index.js'

import { Button, NoListResults, useTranslation } from '@payloadcms/ui'
import React from 'react'

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
                {t('plugin-mcp:generateAPIKey')}
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
