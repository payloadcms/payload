import type { AdminViewProps } from 'payload/types'

import { Logo } from '@payloadcms/ui/graphics/Logo'
import { redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { LoginForm } from './LoginForm/index.js'
import './index.scss'

export { generateLoginMetadata } from './meta.js'

export const loginBaseClass = 'login'

export const LoginView: React.FC<AdminViewProps> = ({ initPageResult, searchParams }) => {
  const { req } = initPageResult

  const {
    payload: { config },
    user,
  } = req

  const {
    admin: { components: { afterLogin, beforeLogin } = {}, user: userSlug },
    collections,
    routes: { admin },
  } = config

  if (user) {
    redirect(admin)
  }

  const collectionConfig = collections.find(({ slug }) => slug === userSlug)

  return (
    <Fragment>
      <div className={`${loginBaseClass}__brand`}>
        <Logo config={config} />
      </div>
      {Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => <Component key={i} />)}
      {!collectionConfig?.auth?.disableLocalStrategy && <LoginForm searchParams={searchParams} />}
      {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
    </Fragment>
  )
}
