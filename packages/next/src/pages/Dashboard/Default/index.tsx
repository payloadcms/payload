import React from 'react'
import type { SanitizedConfig } from 'payload/types'

import { Gutter, SetStepNav } from '@payloadcms/ui'
import './index.scss'
import { DefaultDashboardClient } from './index.client'

const baseClass = 'dashboard'

export const DefaultDashboard: React.FC<{
  config: SanitizedConfig
  Link: React.ComponentType<any>
}> = (props) => {
  const {
    config: {
      admin: {
        components: { afterDashboard, beforeDashboard },
      },
    },
    Link,
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
