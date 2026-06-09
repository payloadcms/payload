import type { AdminViewServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { LogoutClient } from '../../exports/client/index.js'
import './index.css'

const baseClass = 'logout'

export const LogoutView: React.FC<
  {
    inactivity?: boolean
  } & AdminViewServerProps
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
