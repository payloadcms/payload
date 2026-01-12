'use client'
import {
  Button,
  LoadingOverlay,
  toast,
  useAuth,
  useConfig,
  useRouteTransition,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect } from 'react'

import './index.scss'

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
}> = (props) => {
  const { adminRoute, inactivity, redirect } = props

  const { logOut, user } = useAuth()
  const { config } = useConfig()

  const { startRouteTransition } = useRouteTransition()

  const isLoggedIn = React.useMemo(() => {
    return Boolean(user?.id)
  }, [user?.id])

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
      toast.success(t('authentication:loggedOutSuccessfully'))
      startRouteTransition(() => router.push(loginRoute))
      return
    }
  }, [logOut, loginRoute, router, startRouteTransition, t])

  useEffect(() => {
    if (isLoggedIn && !inactivity) {
      void handleLogOut()
    } else if (!navigatingToLoginRef.current) {
      navigatingToLoginRef.current = true
      startRouteTransition(() => router.push(loginRoute))
    }
  }, [handleLogOut, isLoggedIn, loginRoute, router, startRouteTransition, inactivity])

  if (!isLoggedIn && inactivity) {
    return (
      <div className={`${baseClass}__wrap`}>
        <h2>{t('authentication:loggedOutInactivity')}</h2>
        <Button buttonStyle="secondary" el="link" size="large" url={loginRoute}>
          {t('authentication:logBackIn')}
        </Button>
      </div>
    )
  }

  return <LoadingOverlay animationDuration={'0ms'} loadingText={t('authentication:loggingOut')} />
}
