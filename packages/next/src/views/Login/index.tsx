import type { AdminViewServerProps } from 'payload'

import { LoginView as LoginViewRender } from '@payloadcms/ui/views/Login'
import { redirect } from 'next/navigation.js'
import { getSafeRedirect } from 'payload/shared'
import React from 'react'

import { Logo } from '../../elements/Logo/index.js'

export { loginBaseClass } from '@payloadcms/ui/views/Login'

export function LoginView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const {
    req: {
      payload: { config },
      user,
    },
  } = initPageResult

  const {
    routes: { admin },
  } = config

  if (user) {
    const redirectUrl = getSafeRedirect({ fallbackTo: admin, redirectTo: searchParams.redirect })
    redirect(redirectUrl)
  }

  return (
    <LoginViewRender
      initPageResult={initPageResult}
      Logo={Logo}
      params={params}
      searchParams={searchParams}
    />
  )
}
