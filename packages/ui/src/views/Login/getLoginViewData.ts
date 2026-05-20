import type { CustomComponent, SanitizedConfig } from 'payload'

import { getSafeRedirect } from 'payload/shared'

export type LoginViewData = {
  afterLogin?: CustomComponent[]
  beforeLogin?: CustomComponent[]
  isLocalStrategyDisabled: boolean
  isLoggedIn: boolean
  prefillEmail?: string
  prefillPassword?: string
  prefillUsername?: string
  redirectUrl: string
  userSlug: string
}

export function getLoginViewData({
  config,
  searchParams,
  user,
}: {
  config: SanitizedConfig
  searchParams: { [key: string]: string | string[] | undefined }
  user: unknown
}): LoginViewData {
  const {
    admin: { components: { afterLogin, beforeLogin } = {}, user: userSlug },
    routes: { admin },
  } = config

  const redirectUrl = getSafeRedirect({
    fallbackTo: admin,
    redirectTo: searchParams.redirect as string,
  })

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

  return {
    afterLogin,
    beforeLogin,
    isLocalStrategyDisabled: !!config.collections?.find((c) => c.slug === userSlug)?.auth
      ?.disableLocalStrategy,
    isLoggedIn: !!user,
    prefillEmail,
    prefillPassword,
    prefillUsername,
    redirectUrl,
    userSlug,
  }
}
