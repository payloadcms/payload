import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RootProvider } from '@payloadcms/ui/providers'
import { RenderCustomComponent } from '@payloadcms/ui/utilities'
import { createClientConfig } from '../../createClientConfig'
import { DefaultDashboard } from '@payloadcms/ui/views'

export const Dashboard = ({ config: configPromise }: { config: Promise<SanitizedConfig> }) =>
  async function () {
    const config = await configPromise
    const clientConfig = await createClientConfig(config)

    const CustomDashboardComponent = config.admin.components?.views?.Dashboard

    return (
      <RootProvider config={clientConfig}>
        <h1>Dashboard (rendered on server)</h1>
        <RenderCustomComponent
          CustomComponent={
            typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
          }
          DefaultComponent={DefaultDashboard}
          componentProps={{
            config,
            clientConfig,
            // collections: collections.filter(
            //   (collection) => permissions?.collections?.[collection.slug]?.read?.permission,
            // ),
            // globals: filteredGlobals,
            // permissions,
            // user,
          }}
        />
      </RootProvider>
    )
  }
