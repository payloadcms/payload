'use client'
import { Button, LoadingOverlay, toast, useAuth, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import { useRouter } from 'next/navigation.js'
import React, { useEffect } from 'react'

import './index.scss'

const baseClass = 'logout'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const LogoutClient: React.FC<{
  adminRoute: string
  inactivity?: boolean
  redirect: string
}> = (props) => {
  const { adminRoute, inactivity, redirect } = props

  const [isLoggedOut, setIsLoggedOut] = React.useState<boolean | undefined>(undefined)
  const logOutSuccessRef = React.useRef(false)
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
  const { logOut } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  const handleLogOut = React.useCallback(async () => {
    const loggedOut = await logOut()
    setIsLoggedOut(loggedOut)
    if (!inactivity && loggedOut && !logOutSuccessRef.current) {
      toast.success(t('authentication:loggedOutSuccessfully'))
      logOutSuccessRef.current = true
      router.push(loginRoute)
      return
    }
  }, [inactivity, logOut, loginRoute, router, t])

  useEffect(() => {
    if (!isLoggedOut) {
      void handleLogOut()
    }
  }, [handleLogOut, isLoggedOut])

  if (isLoggedOut && inactivity) {
    return (
      <div className={`${baseClass}__wrap`}>
        <h2>{t('authentication:loggedOutInactivity')}</h2>
        <Button buttonStyle="secondary" el="link" Link={Link} size="large" url={loginRoute}>
          {t('authentication:logBackIn')}
        </Button>
      </div>
    )
  }

  return <LoadingOverlay animationDuration={'0ms'} loadingText={t('authentication:loggingOut')} />
}
