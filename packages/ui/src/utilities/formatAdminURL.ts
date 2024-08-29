import type { Config } from 'payload'

/** Will read the `routes.admin` config and appropriately handle `"/"` admin paths */
export const formatAdminURL = (args: {
  adminRoute: Config['routes']['admin']
  basePath?: string
  path: string
  serverURL?: Config['serverURL']
}): string => {
  const { adminRoute, basePath = '', path, serverURL } = args

  if (adminRoute) {
    if (adminRoute === '/') {
      if (!path) {
        return `${serverURL || ''}${basePath}${adminRoute}`
      }
    } else {
      return `${serverURL || ''}${basePath}${adminRoute}${path}`
    }
  }

  return `${serverURL || ''}${basePath}${path}`
}
