import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { RenderCustomComponent } from '@payloadcms/ui/elements'
import { DefaultDashboard } from '@payloadcms/ui/views'
import { headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'
import Link from 'next/link'

export const Dashboard = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}) => {
  const headers = getHeaders()

  const config = await configPromise

  await auth({
    headers,
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
        Link,
      }}
    />
  )
}
