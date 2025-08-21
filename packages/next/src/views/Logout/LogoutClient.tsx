'use client'
import {
  Button,
  LoadingOverlay,
  toast,
  useAuth,
  useRouteTransition,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect } from 'react'

import './index.scss'

const baseClass = 'logout'

export const LogoutClient: React.FC<{
  adminRoute: string
  inactivity?: boolean
  redirect: string
}> = (props) => {
  const { adminRoute, inactivity, redirect } = props

  const { logOut, user } = useAuth()

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
    await logOut()

    if (!inactivity && !navigatingToLoginRef.current) {
      toast.success(t('authentication:loggedOutSuccessfully'))
      navigatingToLoginRef.current = true
      startRouteTransition(() => router.push(loginRoute))
      return
    }
  }, [inactivity, logOut, loginRoute, router, startRouteTransition, t])

  useEffect(() => {
    if (isLoggedIn) {
      void handleLogOut()
    } else if (!navigatingToLoginRef.current) {
      navigatingToLoginRef.current = true
      startRouteTransition(() => router.push(loginRoute))
    }
  }, [handleLogOut, isLoggedIn, loginRoute, router, startRouteTransition])

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
