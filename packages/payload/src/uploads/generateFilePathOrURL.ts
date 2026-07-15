import type { Config } from '../config/types.js'

import { formatAdminURL } from '../utilities/formatAdminURL.js'

/**
 * Generates a file path or URL based on the provided parameters.
 *
 * If urlOrPath is an external URL, it returns it as is.
 * If a filename is provided, it constructs a URL using the collection slug and API route.
 * If neither condition is met, it returns null.
 *
 * If you set relative to true, the returned URL will be relative to the serverURL (unless external).
 */
export function generateFilePathOrURL({
  collectionSlug,
  config,
  filename,
  relative,
  serverURL,
  urlOrPath,
}: {
  collectionSlug: string
  config: Config
  filename?: string
  relative: boolean
  serverURL?: string
  urlOrPath: string | undefined
}): null | string {
  if (urlOrPath) {
    const isRelativePath = urlOrPath.startsWith('/')
    // Only treat urlOrPath as belonging to this server if a serverURL is actually
    // configured. Otherwise `''.startsWith('')` is always true, which would cause
    // every external (e.g. cloud storage / CDN) URL to be misidentified as internal.
    const isSameOriginAsServer = Boolean(serverURL) && urlOrPath.startsWith(serverURL as string)

    if (!isRelativePath && !isSameOriginAsServer) {
      // external url
      return urlOrPath
    }
  }

  if (filename) {
    // local file url
    return formatAdminURL({
      apiRoute: config.routes?.api || '',
      path: `/${collectionSlug}/file/${encodeURIComponent(filename)}`,
      relative,
      serverURL: config.serverURL,
    })
  }

  return null
}
