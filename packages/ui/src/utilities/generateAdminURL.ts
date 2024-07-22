import type { Config } from 'payload'

/** Will read the `routes.admin` config and appropriately handle "/" paths */
export const generateAdminURL = (
  path: string,
  adminRoute: Config['routes']['admin'],
  serverURL?: Config['serverURL'],
): string => {
  if (adminRoute && adminRoute !== '/') {
    return `${serverURL || ''}${adminRoute}${path}`
  }

  return `${serverURL || ''}${path}`
}
