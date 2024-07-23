import type { Config } from 'payload'

/** Will read the `routes.admin` config and appropriately handle `"/"` admin paths */
export const formatAdminURL = (args: {
  adminRoute: Config['routes']['admin']
  path: string
  serverURL?: Config['serverURL']
}): string => {
  const { adminRoute, path, serverURL } = args

  if (adminRoute) {
    if (adminRoute === '/') {
      if (!path) {
        return `${serverURL || ''}${adminRoute}`
      }
    } else {
      return `${serverURL || ''}${adminRoute}${path}`
    }
  }

  return `${serverURL || ''}${path}`
}
