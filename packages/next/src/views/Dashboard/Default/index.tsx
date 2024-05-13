import type { Permissions } from 'payload/auth'
import type { Payload, SanitizedConfig, VisibleEntities } from 'payload/types'

import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { WithServerSideProps } from '@payloadcms/ui/elements/WithServerSideProps'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import React from 'react'

import { DefaultDashboardClient } from './index.client.js'
import './index.scss'

const baseClass = 'dashboard'

export type DashboardProps = {
  Link: React.ComponentType<any>
  config: SanitizedConfig
  payload: Payload
  permissions: Permissions
  visibleEntities: VisibleEntities
}

export const DefaultDashboard: React.FC<DashboardProps> = (props) => {
  const {
    Link,
    config: {
      admin: {
        components: { afterDashboard, beforeDashboard },
      },
    },
    payload,
    permissions,
    visibleEntities,
  } = props

  const BeforeDashboards = Array.isArray(beforeDashboard)
    ? beforeDashboard.map((Component, i) => (
        <WithServerSideProps Component={Component} key={i} payload={payload} />
      ))
    : null

  const AfterDashboards = Array.isArray(afterDashboard)
    ? afterDashboard.map((Component, i) => (
        <WithServerSideProps Component={Component} key={i} payload={payload} />
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
