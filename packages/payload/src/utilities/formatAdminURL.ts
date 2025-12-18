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
    adminRoute?: NonNullable<Config['routes']>['admin']
    /**
     * The subpath of your application, if specified.
     * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
     * @example '/docs'
     */
    basePath?: string
    includeRelativeBasePath?: boolean
    path?: '' | `/${string}` | null
    /**
     * Return a relative URL, e.g. ignore `serverURL`.
     * Useful for route-matching, etc.
     */
    relative?: boolean
  } & Pick<Config, 'serverURL'>,
): string => {
  const {
    adminRoute = '/admin',
    includeRelativeBasePath = false,
    path = '',
    relative = false,
    serverURL,
  } = args

  const basePath = process.env.NEXT_BASE_PATH || args.basePath || ''

  // Build the pathname from segments
  const segments = [adminRoute && adminRoute !== '/' && adminRoute, path && path].filter(Boolean)

  const pathname = segments.join('') || '/'

  // Return relative URL if requested or no serverURL provided
  if (relative || !serverURL) {
    if (includeRelativeBasePath && basePath) {
      return (basePath + pathname).replace(/\/$/, '') || '/'
    }
    return pathname
  }

  // When serverURL is provided, prepend basePath and construct absolute URL
  const serverURLObj = new URL(serverURL)
  const fullPath = (basePath + pathname).replace(/\/$/, '') || '/'

  return new URL(fullPath, serverURLObj.origin).toString()
}
