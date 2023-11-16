import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RootProvider } from '@payloadcms/ui/providers'
import { createClientConfig } from '../../createClientConfig'

export const Dashboard = ({ config: configPromise }: { config: Promise<SanitizedConfig> }) =>
  async function () {
    const config = await createClientConfig(configPromise)

    return (
      <RootProvider config={config}>
        <h1>Dashboard (rendered on server)</h1>
      </RootProvider>
    )
  }
