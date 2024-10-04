import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import * as qs from 'qs-esm'

type Args = {
  config
  route: string
  searchParams: { [key: string]: string | string[] }
}
export const handleAuthRedirect = ({ config, route, searchParams }: Args) => {
  const {
    admin: {
      routes: { login: loginRouteFromConfig },
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

  const loginRoute = formatAdminURL({ adminRoute, path: loginRouteFromConfig })

  const parsedLoginRouteSearchParams = qs.parse(loginRoute.split('?')[1] ?? '')

  const searchParamsWithRedirect = `${qs.stringify(
    {
      ...parsedLoginRouteSearchParams,
      ...(redirectRoute ? { redirect: redirectRoute } : {}),
    },
    { addQueryPrefix: true },
  )}`

  redirect(`${loginRoute.split('?')[0]}${searchParamsWithRedirect}`)
}
