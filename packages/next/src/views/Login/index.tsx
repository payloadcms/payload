import type { AdminViewProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { Logo } from '../../elements/Logo/index.js'
import './index.scss'
import { LoginForm } from './LoginForm/index.js'

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

  if (user) {
    redirect((searchParams.redirect as string) || admin)
  }

  const collectionConfig = payload?.collections?.[userSlug]?.config

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
      {RenderServerComponent({
        Component: beforeLogin,
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
      })}

      {!collectionConfig?.auth?.disableLocalStrategy && (
        <LoginForm
          prefillEmail={prefillEmail}
          prefillPassword={prefillPassword}
          prefillUsername={prefillUsername}
          searchParams={searchParams}
        />
      )}
      {RenderServerComponent({
        Component: afterLogin,
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
      })}
    </Fragment>
  )
}
