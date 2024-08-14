import type { AdminViewProps } from 'payload'

import { RenderComponent, getCreateMappedComponent } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { Logo } from '../../elements/Logo/index.js'
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

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const mappedBeforeLogins = createMappedComponent(beforeLogin, undefined, undefined, 'beforeLogin')

  const mappedAfterLogins = createMappedComponent(afterLogin, undefined, undefined, 'afterLogin')

  if (user) {
    redirect(admin)
  }

  const collectionConfig = collections.find(({ slug }) => slug === userSlug)

  const prefillAutoLogin =
    typeof config.admin?.autoLogin === 'object' && config.admin?.autoLogin.prefillOnly

  const prefillUsername =
    prefillAutoLogin && typeof config.admin?.autoLogin === 'object'
      ? config.admin?.autoLogin.username
      : undefined

  const prefillEmail =
    prefillAutoLogin && typeof config.admin?.autoLogin === 'object'
      ? config.admin?.autoLogin.email
      : undefined

  const prefillPassword =
    prefillAutoLogin && typeof config.admin?.autoLogin === 'object'
      ? config.admin?.autoLogin.password
      : undefined

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
      <RenderComponent mappedComponent={mappedBeforeLogins} />
      {!collectionConfig?.auth?.disableLocalStrategy && (
        <LoginForm
          prefillEmail={prefillEmail}
          prefillPassword={prefillPassword}
          prefillUsername={prefillUsername}
          searchParams={searchParams}
        />
      )}
      <RenderComponent mappedComponent={mappedAfterLogins} />
    </Fragment>
  )
}
