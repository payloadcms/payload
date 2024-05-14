import { redirect } from 'next/navigation.js'
import QueryString from 'qs'

import { isAdminAuthRoute, isAdminRoute } from './shared.js'

export const handleAuthRedirect = ({
  adminRoute,
  redirectUnauthenticatedUser,
  route,
  searchParams,
}: {
  adminRoute: string
  redirectUnauthenticatedUser: boolean | string
  route: string
  searchParams: { [key: string]: string | string[] }
}) => {
  if (!isAdminAuthRoute(route, adminRoute)) {
    if (searchParams && 'redirect' in searchParams) delete searchParams.redirect

    const redirectRoute = encodeURIComponent(
      route + Object.keys(searchParams ?? {}).length
        ? `${QueryString.stringify(searchParams, { addQueryPrefix: true })}`
        : undefined,
    )

    const adminLoginRoute = `${adminRoute}/login`

    const customLoginRoute =
      typeof redirectUnauthenticatedUser === 'string' ? redirectUnauthenticatedUser : undefined

    const loginRoute = isAdminRoute(route, adminRoute)
      ? adminLoginRoute
      : customLoginRoute || '/login'

    const parsedLoginRouteSearchParams = QueryString.parse(loginRoute.split('?')[1] ?? '')

    const searchParamsWithRedirect = `${QueryString.stringify(
      {
        ...parsedLoginRouteSearchParams,
        ...(redirectRoute ? { redirect: redirectRoute } : {}),
      },
      { addQueryPrefix: true },
    )}`

    redirect(`${loginRoute.split('?')[0]}${searchParamsWithRedirect}`)
  }
}
