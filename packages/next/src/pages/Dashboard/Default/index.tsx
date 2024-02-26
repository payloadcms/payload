import type { SanitizedConfig } from 'payload/types'

import { Gutter, SetStepNav } from '@payloadcms/ui'
import React from 'react'

import { DefaultDashboardClient } from './index.client'
import './index.scss'

const baseClass = 'dashboard'

export const DefaultDashboard: React.FC<{
  Link: React.ComponentType<any>
  config: SanitizedConfig
}> = (props) => {
  const {
    Link,
    config: {
      admin: {
        components: { afterDashboard, beforeDashboard },
      },
    },
  } = props

  return (
    <div className={baseClass}>
      <SetStepNav nav={[]} />
      <Gutter className={`${baseClass}__wrap`}>
        {Array.isArray(beforeDashboard) &&
          beforeDashboard.map((Component, i) => <Component key={i} />)}
        <DefaultDashboardClient Link={Link} />
        {Array.isArray(afterDashboard) &&
          afterDashboard.map((Component, i) => <Component key={i} />)}
      </Gutter>
    </div>
  )
}
