import type { Config } from '../config/types.js'

/**
 * This function builds correct URLs for admin panel routing.
 * Its primary responsibilities are:
 * 1. Read from your `routes.admin` config and appropriately handle `"/"` admin paths
 * 2. Prepend the `basePath` from your Next.js config, if specified
 * 3. Return relative or absolute URLs, as needed
 */
export const formatAdminURL = (
  args: {
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
  } & Pick<Config, 'serverURL'>,
): string => {
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
