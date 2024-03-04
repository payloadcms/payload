import { MinimalTemplate } from '@payloadcms/ui'
import React from 'react'

import type { AdminViewProps } from '../Root'

import { LogoutClient } from './LogoutClient'
import './index.scss'

const baseClass = 'logout'

export { generateLogoutMetadata } from './meta'

export const Logout: React.FC<
  AdminViewProps & {
    inactivity?: boolean
  }
> = ({ inactivity, initPageResult, searchParams }) => {
  const {
    req: {
      payload: {
        config: {
          routes: { admin },
        },
      },
    },
  } = initPageResult

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <LogoutClient
          adminRoute={admin}
          inactivity={inactivity}
          redirect={searchParams.redirect as string}
        />
      </div>
    </MinimalTemplate>
  )
}

export const LogoutInactivity: React.FC<AdminViewProps> = (props) => {
  return <Logout inactivity {...props} />
}
