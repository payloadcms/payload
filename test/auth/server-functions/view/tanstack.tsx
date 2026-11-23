import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'

import { TanStackLoginForm } from '../login/tanstack.js'
import { TanStackLogoutButton } from '../logout/tanstack.js'
import { TanStackRefreshToken } from '../refresh/tanstack.js'
import { ServerFunctionsView } from './index.js'

export function TanStackServerFunctionsView({ initPageResult }: AdminViewServerProps) {
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
      login={<TanStackLoginForm dashboardURL={dashboardURL} />}
      logout={<TanStackLogoutButton loginURL={loginURL} />}
      refresh={<TanStackRefreshToken />}
    />
  )
}
