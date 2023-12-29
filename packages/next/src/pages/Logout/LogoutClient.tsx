'use client'
import React, { Fragment, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../../ui/src/providers/Auth'
import { Button } from '@payloadcms/ui'

export const LogoutClient: React.FC<{
  inactivity?: boolean
  adminRoute: string
  redirect: string
}> = (props) => {
  const { inactivity, adminRoute, redirect } = props

  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean | undefined>(undefined)
  const [hasLoggedOut, setHasLoggedOut] = React.useState<boolean | undefined>(undefined)
  const { logOut, user } = useAuth()

  useEffect(() => {
    if (!isLoggingOut) {
      setIsLoggingOut(true)
      logOut()
    }
  }, [isLoggingOut, logOut])

  if (isLoggingOut) {
    return (
      <Fragment>
        {inactivity && (
          <h2>
            Logged Out Due To Inactivity
            {/* {t('loggedOutInactivity')} */}
          </h2>
        )}
        {!inactivity && (
          <h2>
            Logged Out Successfully
            {/* {t('loggedOutSuccessfully')} */}
          </h2>
        )}
        <Button
          buttonStyle="secondary"
          el="anchor"
          url={`${adminRoute}/login${
            redirect && redirect.length > 0 ? `?redirect=${encodeURIComponent(redirect)}` : ''
          }`}
        >
          Log Back In
          {/* {t('logBackIn')} */}
        </Button>
      </Fragment>
    )
  }

  return <Fragment>Logging Out...</Fragment>
}
