import type { Config } from '../config/types.js'

import { formatAdminURL } from './formatAdminURL.js'

/** Will read the `routes.api` config and appropriately handle `"/"` api paths */
export const formatApiURL = (args: {
  apiRoute: NonNullable<Config['routes']>['api']
  basePath?: string
  path: '' | `/${string}` | null | undefined
  serverURL: Config['serverURL']
}): string => {
  return formatAdminURL({
    adminRoute: args.apiRoute,
    basePath: args.basePath,
    path: args.path,
    serverURL: args.serverURL,
  })
}
