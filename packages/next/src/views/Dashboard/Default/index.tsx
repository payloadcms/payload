import type { Permissions } from 'payload/auth'
import type { SanitizedConfig, VisibleEntities } from 'payload/types'

import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import React from 'react'

import { DefaultDashboardClient } from './index.client.js'
import './index.scss'

const baseClass = 'dashboard'

export type DashboardProps = {
  Link: React.ComponentType<any>
  config: SanitizedConfig
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
    permissions,
    visibleEntities,
  } = props

  return (
    <div className={baseClass}>
      <SetStepNav nav={[]} />
      <SetViewActions actions={[]} />
      <Gutter className={`${baseClass}__wrap`}>
        {Array.isArray(beforeDashboard) &&
          beforeDashboard.map((Component, i) => <Component key={i} />)}
        <DefaultDashboardClient
          Link={Link}
          permissions={permissions}
          visibleEntities={visibleEntities}
        />
        {Array.isArray(afterDashboard) &&
          afterDashboard.map((Component, i) => <Component key={i} />)}
      </Gutter>
    </div>
  )
}
