import React, { useEffect } from 'react'
import type { SanitizedConfig } from 'payload/types'

import { Gutter, SetStepNav, useActions } from '@payloadcms/ui'
import { DefaultDashboardClient } from './index.client'

import './index.scss'

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

  const { setViewActions } = useActions()

  useEffect(() => {
    setViewActions([])
  }, [setViewActions])

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
