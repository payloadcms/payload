import { redirect } from 'next/navigation.js'
import QueryString from 'qs'

import { isAdminAuthRoute } from './shared.js'

export const handleAuthRedirect = ({
  adminRoute,
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

    const stringifiedSearchParams = Object.keys(searchParams ?? {}).length
      ? `?${QueryString.stringify(searchParams)}`
      : ''

    redirect(`${adminRoute}/login?redirect=${route + stringifiedSearchParams}`)
  }
}
