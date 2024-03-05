import type { SanitizedConfig } from 'payload/types'

import { Gutter, SetStepNav, SetViewActions } from '@payloadcms/ui'
import React from 'react'

import { DefaultDashboardClient } from './index.client'
import './index.scss'
import { Permissions } from 'payload/auth'

const baseClass = 'dashboard'

export type DashboardProps = {
  Link: React.ComponentType<any>
  config: SanitizedConfig
  visibleCollections: string[]
  visibleGlobals: string[]
  permissions: Permissions
}

export const DefaultDashboard: React.FC<DashboardProps> = (props) => {
  const {
    Link,
    config: {
      admin: {
        components: { afterDashboard, beforeDashboard },
      },
    },
    visibleCollections,
    visibleGlobals,
    permissions,
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
          visibleCollections={visibleCollections}
          visibleGlobals={visibleGlobals}
          permissions={permissions}
        />
        {Array.isArray(afterDashboard) &&
          afterDashboard.map((Component, i) => <Component key={i} />)}
      </Gutter>
    </div>
  )
}
