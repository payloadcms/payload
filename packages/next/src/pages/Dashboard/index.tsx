import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RootProvider } from '@payloadcms/ui/providers'
import { RenderCustomComponent } from '@payloadcms/ui/elements'
import { createClientConfig } from '../../createClientConfig'
import { DefaultDashboard } from '@payloadcms/ui/views'

export const Dashboard = ({ config: configPromise }: { config: Promise<SanitizedConfig> }) =>
  async function () {
    const config = await configPromise
    const clientConfig = await createClientConfig(config)

    const CustomDashboardComponent = config.admin.components?.views?.Dashboard

    return (
      <RootProvider config={clientConfig}>
        <RenderCustomComponent
          CustomComponent={
            typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
          }
          DefaultComponent={DefaultDashboard}
          componentProps={{
            config,
            clientConfig,
          }}
        />
      </RootProvider>
    )
  }
