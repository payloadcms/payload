import type { Config } from '../config/types.js'

import { formatAdminURL, stripTrailingSlash } from '../utilities/formatAdminURL.js'

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
    if (!urlOrPath.startsWith('/') && !urlOrPath.startsWith(serverURL || '')) {
      // external url
      return urlOrPath
    }
  }

  if (filename) {
    // local file url
    const url = formatAdminURL({
      apiRoute: config.routes?.api || '',
      path: `/${collectionSlug}/file/${encodeURIComponent(filename)}`,
      relative,
      serverURL: config.serverURL,
    })

    // A file URL points at an object, not a route: with Next.js `trailingSlash: true`,
    // formatAdminURL appends a slash (`/api/media/file/image.png/`), which storage
    // adapters and CDNs resolve to a different, missing key.
    const queryIndex = url.search(/[?#]/)

    return queryIndex === -1
      ? stripTrailingSlash(url)
      : `${stripTrailingSlash(url.slice(0, queryIndex))}${url.slice(queryIndex)}`
  }

  return null
}
