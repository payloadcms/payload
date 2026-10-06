'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '../../elements/Button/index.js'
import { LoadingOverlay } from '../../elements/Loading/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'logout'

/**
 * This component should **just** be the inactivity route and do nothing with logging the user out.
 *
 * It currently handles too much, the auth provider should just log the user out and then
 * we could remove the useEffect in this file. So instead of the logout button
 * being an anchor link, it should be a button that calls `logOut` in the provider.
 *
 * This view is still useful if cookies attempt to refresh and fail, i.e. the user
 * is logged out due to inactivity.
 */
export const LogoutClient: React.FC<{
  adminRoute: string
  inactivity?: boolean
  redirect: string
  /**
   * The server-resolved user for the logout request. This is the source of
   * truth for *who* to log out: the client `useAuth().user` is unreliable here
   * because the admin `AuthProvider` clears any user that isn't in the admin
   * user collection (a non-admin/public user resolves to `null` via `/me`).
   * On adapters that mount this view's tree after the layout's auth effects
   * (e.g. TanStack Start, where the RSC payload streams in after hydration),
   * that clear races ahead of this component and `useAuth().user` is already
   * `null` at mount — so relying on it would skip the logout request entirely.
   */
  user?: { collection?: string; id?: number | string } | null
}> = (props) => {
  const { adminRoute, inactivity, redirect, user: serverUser } = props

  const { logOut, user: clientUser } = useAuth()

  // Prefer the client user when present (covers token refresh / inactivity),
  // but fall back to the server-resolved user so the logout still fires when
  // the client auth state has already been cleared (see `user` prop above).
  const logoutUser = clientUser ?? serverUser

  const { startRouteTransition } = useRouteTransition()

  const isLoggedIn = React.useMemo(() => {
    return Boolean(logoutUser?.id)
  }, [logoutUser?.id])

  const navigatingToLoginRef = React.useRef(false)

  const [loginRoute] = React.useState(() =>
    formatAdminURL({
      adminRoute,
      path: `/login${
        inactivity && redirect && redirect.length > 0
          ? `?redirect=${encodeURIComponent(redirect)}`
          : ''
      }`,
    }),
  )

  const { t } = useTranslation()
  const router = useRouter()

  const handleLogOut = React.useCallback(async () => {
    if (!navigatingToLoginRef.current) {
      navigatingToLoginRef.current = true
      await logOut()
      toast(t('authentication:loggedOutSuccessfully'))
      startRouteTransition(() => router.push(loginRoute))
      return
    }
  }, [logOut, loginRoute, router, startRouteTransition, t])

  useEffect(() => {
    if (isLoggedIn && !inactivity) {
      void handleLogOut()
    } else if (!inactivity && !navigatingToLoginRef.current) {
      navigatingToLoginRef.current = true
      startRouteTransition(() => router.push(loginRoute))
    }
  }, [handleLogOut, isLoggedIn, loginRoute, router, startRouteTransition, inactivity])

  if (!isLoggedIn && inactivity) {
    return (
      <div className={`${baseClass}__wrap`}>
        <h2>{t('authentication:loggedOutInactivity')}</h2>
        <Button buttonStyle="primary" el="link" size="medium" url={loginRoute}>
          {t('authentication:logBackIn')}
        </Button>
      </div>
    )
  }

  return <LoadingOverlay animationDuration={'0ms'} loadingText={t('authentication:loggingOut')} />
}
