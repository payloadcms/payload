'use client'
import { Button, useAuth, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React, { Fragment, useEffect } from 'react'

import './index.scss'

const baseClass = 'logout'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const LogoutClient: React.FC<{
  adminRoute: string
  inactivity?: boolean
  redirect: string
}> = (props) => {
  const { adminRoute, inactivity, redirect } = props

  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean | undefined>(undefined)
  const { logOut } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isLoggingOut) {
      setIsLoggingOut(true)
      void logOut()
    }
  }, [isLoggingOut, logOut])

  if (isLoggingOut) {
    return (
      <div className={`${baseClass}__wrap`}>
        {inactivity && <h2>{t('authentication:loggedOutInactivity')}</h2>}
        {!inactivity && <h2>{t('authentication:loggedOutSuccessfully')}</h2>}
        <Button
          buttonStyle="secondary"
          el="link"
          Link={Link}
          size="large"
          url={formatAdminURL({
            adminRoute,
            path: `/login${
              redirect && redirect.length > 0 ? `?redirect=${encodeURIComponent(redirect)}` : ''
            }`,
          })}
        >
          {t('authentication:logBackIn')}
        </Button>
      </div>
    )
  }

  return <Fragment>{t('authentication:loggingOut')}</Fragment>
}
