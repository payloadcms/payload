import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RenderCustomComponent } from '@payloadcms/ui/elements'
import { DefaultDashboard } from '@payloadcms/ui/views'

export const Dashboard = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}) => {
  const config = await configPromise

  const CustomDashboardComponent = config.admin.components?.views?.Dashboard

  return (
    <RenderCustomComponent
      CustomComponent={
        typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
      }
      DefaultComponent={DefaultDashboard}
      componentProps={{
        config,
      }}
    />
  )
}
