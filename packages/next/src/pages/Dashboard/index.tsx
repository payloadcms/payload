import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RenderCustomComponent } from '@payloadcms/ui/elements'
import { DefaultDashboard } from '@payloadcms/ui/views'
import { initPage } from '../../utilities/initPage'

export const Dashboard = async ({
  searchParams,
  config: configPromise,
}: {
  searchParams: { [key: string]: string | undefined }
  config: Promise<SanitizedConfig>
}) => {
  const { config } = await initPage(configPromise)

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
