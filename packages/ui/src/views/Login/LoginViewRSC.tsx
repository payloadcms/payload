import type { AdminViewServerProps, ServerProps } from 'payload'

import React, { Fragment } from 'react'

import { Logo } from '../../elements/LogoServer/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { getLoginViewData } from './getLoginViewData.js'
import { LoginForm } from './LoginForm/index.js'
import './index.css'

export const loginBaseClass = 'login'

/**
 * Framework-agnostic Login view RSC.
 *
 * Resolves login data via `getLoginViewData` and renders the login UI with
 * `Logo`, `beforeLogin`/`afterLogin` slots, and the `LoginForm`.
 *
 * Throws `Error('redirect:<url>')` when the user is already authenticated;
 * the framework adapter catches and translates into its native redirect.
 */
export const LoginViewRSC = ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload: { config },
    payload,
    user,
  } = req

  const loginData = getLoginViewData({ config, searchParams, user })

  if (loginData.isLoggedIn) {
    throw new Error(`redirect:${loginData.redirectUrl}`)
  }

  const serverProps: ServerProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    renderComponent: RenderServerComponent,
    searchParams,
    user,
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
        serverProps,
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
        serverProps,
      })}
    </Fragment>
  )
}
