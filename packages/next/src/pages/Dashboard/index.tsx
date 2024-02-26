import type { SanitizedConfig } from 'payload/types'

import { HydrateClientUser, RenderCustomComponent } from '@payloadcms/ui'
import Link from 'next/link'
import React, { Fragment } from 'react'

import { initPage } from '../../utilities/initPage'
import { DefaultDashboard } from './Default'

export const Dashboard = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, permissions, user } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: true,
    route: '',
    searchParams,
  })

  const CustomDashboardComponent = config.admin.components?.views?.Dashboard

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <RenderCustomComponent
        CustomComponent={
          typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
        }
        DefaultComponent={DefaultDashboard}
        componentProps={{
          Link,
          config,
          user,
        }}
      />
    </Fragment>
  )
}
