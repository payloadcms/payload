import type { SanitizedConfig } from 'payload/types'
import type { Metadata } from 'next'

import { HydrateClientUser, RenderCustomComponent } from '@payloadcms/ui'
import Link from 'next/link'
import React, { Fragment } from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { DefaultDashboard } from './Default'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: `${t('general:dashboard')} Payload`,
    keywords: `${t('general:dashboard')}, Payload`,
    title: t('general:dashboard'),
  })
}

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
