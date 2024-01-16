'use client'
import React, { Fragment, useEffect } from 'react'
import { useAuth } from '../../../../ui/src/providers/Auth'
import { Button, useTranslation } from '@payloadcms/ui'

export const LogoutClient: React.FC<{
  inactivity?: boolean
  adminRoute: string
  redirect: string
}> = (props) => {
  const { inactivity, adminRoute, redirect } = props

  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean | undefined>(undefined)
  const { logOut } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!isLoggingOut) {
      setIsLoggingOut(true)
      logOut()
    }
  }, [isLoggingOut, logOut])

  if (isLoggingOut) {
    return (
      <Fragment>
        {inactivity && <h2>{t('authentication:loggedOutInactivity')}</h2>}
        {!inactivity && <h2>{t('authentication:loggedOutSuccessfully')}</h2>}
        <Button
          buttonStyle="secondary"
          el="link"
          url={`${adminRoute}/login${
            redirect && redirect.length > 0 ? `?redirect=${encodeURIComponent(redirect)}` : ''
          }`}
        >
          {t('authentication:logBackIn')}
        </Button>
      </Fragment>
    )
  }

  // TODO(i18n): needs translation in all languages
  return <Fragment>Logging Out...</Fragment>
}
