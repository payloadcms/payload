import type { AdminViewProps } from 'payload/types'

import { WithServerSideProps } from '@payloadcms/ui/elements/WithServerSideProps'
import { Logo } from '@payloadcms/ui/graphics/Logo'
import { redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { LoginForm } from './LoginForm/index.js'
import './index.scss'

export { generateLoginMetadata } from './meta.js'

export const loginBaseClass = 'login'

export const LoginView: React.FC<AdminViewProps> = ({ initPageResult, params, searchParams }) => {
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload: { config },
    payload,
    user,
  } = req

  const {
    admin: { components: { afterLogin, beforeLogin } = {}, user: userSlug },
    collections,
    routes: { admin },
  } = config

  const BeforeLogins = Array.isArray(beforeLogin)
    ? beforeLogin.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  const AfterLogins = Array.isArray(afterLogin)
    ? afterLogin.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  if (user) {
    redirect(admin)
  }

  const collectionConfig = collections.find(({ slug }) => slug === userSlug)

  return (
    <Fragment>
      <div className={`${loginBaseClass}__brand`}>
        <Logo
          i18n={i18n}
          locale={locale}
          params={params}
          payload={payload}
          permissions={permissions}
          searchParams={searchParams}
          user={user}
        />
      </div>
      {Array.isArray(BeforeLogins) && BeforeLogins.map((Component) => Component)}
      {!collectionConfig?.auth?.disableLocalStrategy && <LoginForm searchParams={searchParams} />}
      {Array.isArray(AfterLogins) && AfterLogins.map((Component) => Component)}
    </Fragment>
  )
}
