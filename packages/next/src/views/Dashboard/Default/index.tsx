import type { Permissions } from 'payload/auth'
import type { ServerProps } from 'payload/config'
import type { VisibleEntities } from 'payload/types'

import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { WithServerSideProps } from '@payloadcms/ui/elements/WithServerSideProps'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import React from 'react'

import { DefaultDashboardClient } from './index.client.js'
import './index.scss'

const baseClass = 'dashboard'

export type DashboardProps = ServerProps & {
  Link: React.ComponentType<any>

  permissions: Permissions
  visibleEntities: VisibleEntities
}

export const DefaultDashboard: React.FC<DashboardProps> = (props) => {
  const {
    Link,
    i18n,
    locale,
    params,
    payload: {
      config: {
        admin: {
          components: { afterDashboard, beforeDashboard },
        },
      },
    },
    payload,
    permissions,
    searchParams,
    user,
    visibleEntities,
  } = props

  const BeforeDashboards = Array.isArray(beforeDashboard)
    ? beforeDashboard.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  const AfterDashboards = Array.isArray(afterDashboard)
    ? afterDashboard.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  return (
    <div className={baseClass}>
      <SetStepNav nav={[]} />
      <SetViewActions actions={[]} />
      <Gutter className={`${baseClass}__wrap`}>
        {Array.isArray(BeforeDashboards) && BeforeDashboards.map((Component) => Component)}

        <DefaultDashboardClient
          Link={Link}
          permissions={permissions}
          visibleEntities={visibleEntities}
        />
        {Array.isArray(AfterDashboards) && AfterDashboards.map((Component) => Component)}
      </Gutter>
    </div>
  )
}
