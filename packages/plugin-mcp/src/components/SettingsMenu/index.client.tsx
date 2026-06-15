'use client'

import { PopupList, useConfig, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type {
  PluginMCPTranslationKeys,
  PluginMCPTranslations,
} from '../../translations/index.js'

/**
 * Entry in the user menu's Settings sub-popup linking to the API keys
 * collection. The collection is excluded from the main nav
 * (`admin.group: false`) and managed from here instead.
 */
export const MCPSettingsMenu: React.FC = () => {
  const { config } = useConfig()
  const { t } = useTranslation<PluginMCPTranslations, PluginMCPTranslationKeys>()

  return (
    <PopupList.MenuItem>
      <PopupList.GroupLabel label={t('plugin-mcp:mcp')} />
      <PopupList.Button
        href={formatAdminURL({
          adminRoute: config.routes.admin,
          path: '/collections/payload-mcp-api-keys',
        })}
      >
        {t('plugin-mcp:manageAPIKeys')}
      </PopupList.Button>
    </PopupList.MenuItem>
  )
}
