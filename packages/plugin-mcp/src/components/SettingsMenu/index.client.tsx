'use client'

import { PopupList, useConfig } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

/**
 * Entry in the user menu's Settings sub-popup linking to the API keys
 * collection. The collection is excluded from the main nav
 * (`admin.group: false`) and managed from here instead.
 */
export const MCPSettingsMenu: React.FC = () => {
  const { config } = useConfig()

  return (
    <PopupList.MenuItem>
      {/* TODO: needs i18n once design is finalized */}
      <PopupList.GroupLabel label="MCP" />
      <PopupList.Button
        href={formatAdminURL({
          adminRoute: config.routes.admin,
          path: '/collections/payload-mcp-api-keys',
        })}
      >
        {/* TODO: needs i18n once design is finalized */}
        Manage API keys
      </PopupList.Button>
    </PopupList.MenuItem>
  )
}
