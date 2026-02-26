'use client'
import type { ClientAdminConfig } from 'payload'

import { ClientAdminConfigProvider } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import clientConfig from '../../../test/_community/payload.config.client.js'
import sharedConfig from '../../../test/_community/payload.config.shared.js'

function mergeSharedIntoClient(
  client: ClientAdminConfig,
  shared: Record<string, { validate?: any }>,
): ClientAdminConfig {
  const merged: ClientAdminConfig = { ...client }

  for (const [path, sharedFieldConfig] of Object.entries(shared)) {
    if (!merged[path]) {
      merged[path] = {}
    }
    if (sharedFieldConfig.validate && !merged[path].validate) {
      merged[path] = { ...merged[path], validate: sharedFieldConfig.validate }
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
