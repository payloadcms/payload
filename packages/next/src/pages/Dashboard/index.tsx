import { SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import { RenderCustomComponent, DefaultDashboard, HydrateClientUser } from '@payloadcms/ui'
import Link from 'next/link'
import { initPage } from '../../utilities/initPage'

export const Dashboard = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}) => {
  const { config, user } = await initPage(configPromise)

  const CustomDashboardComponent = config.admin.components?.views?.Dashboard

  return (
    <Fragment>
      <HydrateClientUser user={user} />
      <RenderCustomComponent
        CustomComponent={
          typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
        }
        DefaultComponent={DefaultDashboard}
        componentProps={{
          config,
          Link,
          user,
        }}
      />
    </Fragment>
  )
}
