import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RenderCustomComponent } from '@payloadcms/ui/elements'
import { DefaultDashboard } from '@payloadcms/ui/views'
import { headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'

export const Dashboard = async ({
  searchParams,
  config: configPromise,
}: {
  searchParams: URLSearchParams
  config: Promise<SanitizedConfig>
}) => {
  const headers = getHeaders()

  const config = await configPromise

  await auth({
    headers,
    searchParams,
    config: configPromise,
  })

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
