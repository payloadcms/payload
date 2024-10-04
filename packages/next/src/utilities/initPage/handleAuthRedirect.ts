import type { User } from 'payload'

import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import * as qs from 'qs-esm'

type Args = {
  config
  route: string
  searchParams: { [key: string]: string | string[] }
  user?: User
}
export const handleAuthRedirect = ({ config, route, searchParams, user }: Args) => {
  const {
    admin: {
      routes: { login: loginRouteFromConfig, unauthorized: unauthorizedRoute },
    },
    routes: { admin: adminRoute },
  } = config

  if (searchParams && 'redirect' in searchParams) {
    delete searchParams.redirect
  }

  const redirectRoute = encodeURIComponent(
    route + Object.keys(searchParams ?? {}).length
      ? `${qs.stringify(searchParams, { addQueryPrefix: true })}`
      : undefined,
  )

  const redirectTo = formatAdminURL({
    adminRoute,
    path: user ? unauthorizedRoute : loginRouteFromConfig,
  })

  const parsedLoginRouteSearchParams = qs.parse(redirectTo.split('?')[1] ?? '')

  const searchParamsWithRedirect = `${qs.stringify(
    {
      ...parsedLoginRouteSearchParams,
      ...(redirectRoute ? { redirect: redirectRoute } : {}),
    },
    { addQueryPrefix: true },
  )}`

  redirect(`${redirectTo.split('?')[0]}${searchParamsWithRedirect}`)
}
