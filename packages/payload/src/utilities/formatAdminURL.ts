import type { Config } from '../config/types.js'

/** Will read the `routes.admin` config and appropriately handle `"/"` admin paths */
export const formatAdminURL = (args: {
  adminRoute: NonNullable<Config['routes']>['admin']
  /**
   * The subpath of your application, if specified.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
   * @example '/docs'
   */
  basePath?: string
  path?: '' | `/${string}` | null
  /**
   * Return a relative URL, e.g. ignore `serverURL`.
   * Useful for route-matching, etc.
   */
  relative?: boolean
  serverURL?: Config['serverURL']
}): string => {
  const { adminRoute, basePath = '', path = '', relative = false, serverURL } = args

  const pathSegments = [basePath]

  if (adminRoute && adminRoute !== '/') {
    pathSegments.push(adminRoute)
  }

  if (path && !(adminRoute === '/' && !path)) {
    pathSegments.push(path)
  }

  const pathname = pathSegments.join('') || '/'

  if (relative || !serverURL) {
    return pathname
  }

  return new URL(pathname, serverURL).toString()
}
