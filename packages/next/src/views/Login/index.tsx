import type { AdminViewServerProps, ServerProps } from 'payload'

import { getLoginViewData } from '@payloadcms/ui/views/Login/getLoginViewData'
import { LoginForm } from '@payloadcms/ui/views/Login/LoginForm'
import { redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { Logo } from '../../elements/Logo/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

import '@payloadcms/ui/views/Login/index.css'
export const loginBaseClass = 'login'

export function LoginView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload: { config },
    payload,
    user,
  } = req

  const loginData = getLoginViewData({ config, searchParams, user })

  if (loginData.isLoggedIn) {
    redirect(loginData.redirectUrl)
  }

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
        Component: loginData.beforeLogin,
        importMap: payload.importMap,
        serverProps: {
          i18n,
          locale,
          params,
          payload,
          permissions,
          renderComponent: RenderServerComponent,
          searchParams,
          user,
        } satisfies ServerProps,
      })}
      {!loginData.isLocalStrategyDisabled && (
        <LoginForm
          prefillEmail={loginData.prefillEmail}
          prefillPassword={loginData.prefillPassword}
          prefillUsername={loginData.prefillUsername}
          searchParams={searchParams}
        />
      )}
      {RenderServerComponent({
        Component: loginData.afterLogin,
        importMap: payload.importMap,
        serverProps: {
          i18n,
          locale,
          params,
          payload,
          permissions,
          renderComponent: RenderServerComponent,
          searchParams,
          user,
        } satisfies ServerProps,
      })}
    </Fragment>
  )
}
