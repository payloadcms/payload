'use client'
import type { ClientAdminConfig, SharedAdminConfig } from 'payload'

import { ClientAdminConfigProvider } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import clientConfig from '../../../test/_community/payload.config.client.js'
import sharedConfig from '../../../test/_community/payload.config.shared.js'

function mergeSharedIntoClient(
  client: ClientAdminConfig,
  shared: SharedAdminConfig,
): ClientAdminConfig {
  const merged: ClientAdminConfig = { ...client }

  if (shared.fields) {
    merged.fields = { ...merged.fields }
    for (const [path, sharedFieldConfig] of Object.entries(shared.fields)) {
      if (!merged.fields[path]) {
        merged.fields[path] = {}
      }
      if (sharedFieldConfig.validate && !merged.fields[path].validate) {
        merged.fields[path] = { ...merged.fields[path], validate: sharedFieldConfig.validate }
      }
    }
  }

  return merged
}

export const ClientConfigBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mergedConfig = useMemo(
    () => mergeSharedIntoClient(clientConfig ?? {}, sharedConfig ?? {}),
    [],
  )

  return <ClientAdminConfigProvider config={mergedConfig}>{children}</ClientAdminConfigProvider>
}
