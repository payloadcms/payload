import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'

import { NextLoginForm } from '../login/next.js'
import { NextLogoutButton } from '../logout/next.js'
import { NextRefreshToken } from '../refresh/next.js'
import { ServerFunctionsView } from './index.js'

export function NextServerFunctionsView({ initPageResult }: AdminViewServerProps) {
  const {
    req: {
      payload: {
        config: {
          admin: {
            routes: { login: loginRoute },
          },
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult

  const dashboardURL = formatAdminURL({ adminRoute, path: '' })
  const loginURL = formatAdminURL({ adminRoute, path: loginRoute })

  return (
    <ServerFunctionsView
      isAuthenticated={Boolean(user)}
      login={<NextLoginForm dashboardURL={dashboardURL} />}
      logout={<NextLogoutButton loginURL={loginURL} />}
      refresh={<NextRefreshToken />}
    />
  )
}
