import type { AllowList, UploadConfig } from './types.js'

import { APIError } from '../errors/APIError.js'
import { isURLAllowed } from '../utilities/isURLAllowed.js'
import { safeFetch } from './safeFetch.js'

/**
 * Fetches a file, checking each redirect against the allow list and SSRF restrictions.
 * Returns the unread response so callers can either stream it or buffer it into a Payload File.
 * Callers enforce any initial URL restrictions; existing uploads may also use same-origin URLs.
 */
export const fetchWithRedirects = async ({
  allowList,
  headers,
  skipSafeFetch,
  timeout,
  url,
}: {
  allowList?: AllowList
  headers?: Record<string, string>
  skipSafeFetch?: UploadConfig['skipSafeFetch']
  timeout?: number
  url: string
}): Promise<{ response: Response; url: string }> => {
  const maxRedirects = 3

  for (let redirectCount = 0; ; redirectCount++) {
    // Explicitly allowed URLs may point to private hosts, such as an internal CDN.
    const shouldSkipSafeFetch =
      skipSafeFetch === true ||
      (Array.isArray(skipSafeFetch) && isURLAllowed(url, skipSafeFetch)) ||
      (allowList && isURLAllowed(url, allowList))

    const response = await (shouldSkipSafeFetch ? fetch : safeFetch)(url, {
      credentials: 'include',
      headers,
      redirect: 'manual',
      signal: timeout ? AbortSignal.timeout(timeout) : undefined,
    })

    if (response.status >= 300 && response.status < 400) {
      if (redirectCount >= maxRedirects) {
        throw new APIError(`Too many redirects (max ${maxRedirects})`, 403)
      }

      const location = response.headers.get('location')

      if (location) {
        url = new URL(location, url).href

        if (allowList && !isURLAllowed(url, allowList)) {
          throw new APIError('Redirect target is not allowed.', 400)
        }

        continue
      }
    }

    return { response, url }
  }
}
