import type { AdminViewProps } from 'payload'

import React from 'react'

import { LogoutClient } from './LogoutClient.js'
import './index.scss'

const baseClass = 'logout'

export { generateLogoutMetadata } from './meta.js'

export const LogoutView: React.FC<
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
    <div className={`${baseClass}__wrap`}>
      <LogoutClient
        adminRoute={admin}
        inactivity={inactivity}
        redirect={searchParams.redirect as string}
      />
    </div>
  )
}

export const LogoutInactivity: React.FC<AdminViewProps> = (props) => {
  return <LogoutView inactivity {...props} />
}
