import type { Config } from '../config/types.js'

/**
 * Builds correct URLs for admin panel and API routing.
 * Use this for both admin routes (`adminRoute`) and API routes (`apiRoute`).
 *
 * Its primary responsibilities are:
 * 1. Read from your `routes.admin` or `routes.api` config and appropriately handle `"/"` paths
 * 2. Prepend the `basePath` from your Next.js config, if specified
 * 3. Return relative or absolute URLs, as needed
 *
 * @example
 * // Admin route
 * formatAdminURL({ adminRoute, path: `/collections/${slug}` })
 *
 * @example
 * // API route with query params
 * const queryString = qs.stringify({ where, limit, page }, { addQueryPrefix: true })
 * formatAdminURL({ apiRoute: api, path: `/${slug}${queryString}`, serverURL })
 */
type BaseFormatURLArgs = {
  /**
   * The subpath of your application, if specified.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
   * @example '/docs'
   */
  basePath?: string
  includeBasePath?: boolean
  path?: '' | `/${string}` | null
  /**
   * Return a relative URL, e.g. ignore `serverURL`.
   * Useful for route-matching, etc.
   */
  relative?: boolean
} & Pick<Config, 'serverURL'>

type FormatURLArgs =
  | ({
      adminRoute: NonNullable<Config['routes']>['admin']
      apiRoute?: never
    } & BaseFormatURLArgs)
  | ({
      adminRoute?: never
      apiRoute: NonNullable<Config['routes']>['api']
    } & BaseFormatURLArgs)

export const formatAdminURL = (args: FormatURLArgs): string => {
  const {
    adminRoute,
    apiRoute,
    includeBasePath: includeBasePathArg,
    path = '',
    relative = false,
    serverURL,
  } = args
  const basePath = process.env.NEXT_BASE_PATH || args.basePath || ''
  const routePath = adminRoute || apiRoute
  const segments = [routePath && routePath !== '/' && routePath, path && path].filter(Boolean)
  const pathname = segments.join('') || '/'
  const pathnameWithBase = (basePath + pathname).replace(/\/$/, '') || '/'
  const includeBasePath = includeBasePathArg ?? (adminRoute ? false : true)

  if (relative || !serverURL) {
    if (includeBasePath && basePath) {
      return pathnameWithBase
    }
    return pathname
  }

  const serverURLObj = new URL(serverURL)
  return new URL(pathnameWithBase, serverURLObj.origin).toString()
}
