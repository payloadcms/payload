import type { Config } from '../config/types.js'

/**
 * This function builds correct URLs for API routing.
 * Its primary responsibilities are:
 * 1. Read from your `routes.api` config and appropriately handle `"/"` api paths
 * 2. Always prepend the `basePath` from your Next.js config, if specified
 * 3. Return relative or absolute URLs, as needed
 *
 * Note: Unlike formatAdminURL, API routes always include basePath regardless of relative/absolute
 */
export const formatApiURL = (
  args: {
    apiRoute: NonNullable<Config['routes']>['api']
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
  const { apiRoute, basePath, path = '', relative = false, serverURL } = args

  // Build the pathname from segments
  const segments = [apiRoute && apiRoute !== '/' && apiRoute, path && path].filter(Boolean)

  const pathname = segments.join('') || '/'

  // API routes always include basePath, even for relative URLs
  const envBasePath = process.env.NEXT_BASE_PATH || ''
  const fullPath = ((envBasePath || basePath || '') + pathname).replace(/\/$/, '') || '/'

  // Return relative URL if requested or no serverURL provided
  if (relative || !serverURL) {
    return fullPath
  }

  // Construct absolute URL with serverURL
  const serverURLObj = new URL(serverURL)

  return new URL(fullPath, serverURLObj.origin).toString()
}
