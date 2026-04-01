import type { InitPageResult, ServerProps } from 'payload'

import React, { Fragment } from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { LoginForm } from './LoginForm/index.js'
import './index.scss'

export const loginBaseClass = 'login'

export type LoginViewProps = {
  initPageResult: InitPageResult
  /** Logo component to render at the top of the login page */
  Logo?: React.ComponentType<ServerProps>
  params?: { [key: string]: string | string[] | undefined }
  searchParams: { [key: string]: string | string[] | undefined }
}

export function LoginView({ initPageResult, Logo, params, searchParams }: LoginViewProps) {
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload: { config },
    payload,
    user,
  } = req

  const {
    admin: { components: { afterLogin, beforeLogin } = {}, user: userSlug },
  } = config

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
      {Logo && (
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
      )}
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
        } satisfies ServerProps,
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
        } satisfies ServerProps,
      })}
    </Fragment>
  )
}
