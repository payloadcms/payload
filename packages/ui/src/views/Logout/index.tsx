import type { AdminViewServerProps } from 'payload'

import { getSafeRedirect } from 'payload/shared'
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
    req,
    req: {
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult

  // Reaching the inactivity route while still authenticated (e.g. auto-login has
  // re-authenticated the user) means the inactivity screen doesn't apply. Redirect back
  // to where they were headed instead of rendering the logout overlay indefinitely.
  if (inactivity && user) {
    req.server.redirect(
      getSafeRedirect({ fallbackTo: adminRoute, redirectTo: searchParams.redirect as string }),
    )
  }

  return (
    <div className={`${baseClass}`}>
      <LogoutClient
        adminRoute={adminRoute}
        inactivity={inactivity}
        redirect={searchParams.redirect as string}
        user={user ? { id: user.id, collection: user.collection } : null}
      />
    </div>
  )
}
