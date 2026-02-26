'use client'
import type { ClientAdminConfig, SharedAdminConfig } from 'payload'

import { ClientAdminConfigProvider } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import clientConfig from '../../../test/admin/payload.config.admin.client.js'

function mergeSharedIntoClient(
  client: ClientAdminConfig,
  shared?: SharedAdminConfig,
): ClientAdminConfig {
  if (!shared?.fields) {
    return client
  }

  const merged: ClientAdminConfig = { ...client, fields: { ...client.fields } }

  for (const [path, sharedField] of Object.entries(shared.fields)) {
    if (!merged.fields![path]) {
      merged.fields![path] = {}
    }
    if (sharedField.validate && !merged.fields![path].validate) {
      merged.fields![path] = { ...merged.fields![path], validate: sharedField.validate }
    }
  }

  return merged
}

export const ClientConfigBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mergedConfig = useMemo(() => mergeSharedIntoClient(clientConfig ?? {}), [])

  return <ClientAdminConfigProvider config={mergedConfig}>{children}</ClientAdminConfigProvider>
}
