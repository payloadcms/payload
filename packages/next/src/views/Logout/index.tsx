import type { AdminViewProps } from 'payload'

import React from 'react'

import './index.scss'
import { LogoutClient } from './LogoutClient.js'

const baseClass = 'logout'

export { generateLogoutMetadata } from './meta.js'

export const LogoutView: React.FC<
  {
    inactivity?: boolean
  } & AdminViewProps
> = ({ inactivity, initPageResult, searchParams }) => {
  const {
    req: {
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
    },
  } = initPageResult

  return (
    <div className={`${baseClass}`}>
      <LogoutClient
        adminRoute={adminRoute}
        inactivity={inactivity}
        redirect={searchParams.redirect as string}
      />
    </div>
  )
}

export const LogoutInactivity: React.FC<AdminViewProps> = (props) => {
  return <LogoutView inactivity {...props} />
}
