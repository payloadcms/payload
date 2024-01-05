import { SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import { RenderCustomComponent, HydrateClientUser } from '@payloadcms/ui'
import Link from 'next/link'
import { initPage } from '../../utilities/initPage'
import { DefaultDashboard } from './Default'

export const Dashboard = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, user, permissions } = await initPage(configPromise, true)

  const CustomDashboardComponent = config.admin.components?.views?.Dashboard

  return (
    <Fragment>
      <HydrateClientUser user={user} permissions={permissions} />
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
