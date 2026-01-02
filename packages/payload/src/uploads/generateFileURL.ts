import type { Config } from '../config/types.js'

import { formatAdminURL } from '../utilities/formatAdminURL.js'

type GenerateFileURLArgs = {
  apiRoute: NonNullable<Config['routes']>['api']
  collectionSlug: string
  filename?: string
  serverURL: Config['serverURL']
}
export const generateFileURL = ({
  apiRoute,
  collectionSlug,
  filename,
  serverURL,
}: GenerateFileURLArgs) => {
  if (filename) {
    return formatAdminURL({
      apiRoute: apiRoute || '',
      path: `/${collectionSlug}/file/${encodeURIComponent(filename)}`,
      serverURL: serverURL,
    })
  }
  return undefined
}
