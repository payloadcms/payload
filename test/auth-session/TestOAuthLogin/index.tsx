'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { Button, useConfig, useSearchParams } from '@payloadcms/ui'
import { formatAdminURL, getSafeRedirect } from 'payload/shared'
import React from 'react'

import { AUTH_SESSION_TEST_ROUTES, authSessionLoginButtonLabel } from '../shared.js'
import './index.css'

export const TestOAuthLogin: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['beforeLogin'][0]
> = () => {
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()
  const searchParams = useSearchParams()
  const [error, setError] = React.useState<string>()
  const [isLoading, setIsLoading] = React.useState(false)

  const logIn = async () => {
    setError(undefined)
    setIsLoading(true)

    const response = await fetch(
      formatAdminURL({
        apiRoute,
        path: AUTH_SESSION_TEST_ROUTES.LOGIN,
      }),
      { method: 'POST' },
    )

    if (!response.ok) {
      setError(`Login failed with status ${response.status}`)
      setIsLoading(false)
      return
    }

    window.location.assign(
      getSafeRedirect({
        fallbackTo: adminRoute,
        redirectTo: searchParams.get('redirect') ?? '',
      }),
    )
  }

  return (
    <div className="test-oauth-login">
      <Button loading={isLoading} onClick={logIn}>
        {authSessionLoginButtonLabel}
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  )
}
