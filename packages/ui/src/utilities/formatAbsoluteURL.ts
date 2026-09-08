import { isAllowedURL } from './isAllowedURL.js'

/**
 * Ensures the provided URL is absolute. If not, it converts it to an absolute URL based
 * on the current window location.
 * Note: This MUST be called within the client environment as it relies on the `window` object
 * to determine the absolute URL.
 */
export const formatAbsoluteURL = (incomingURL: string): string | undefined => {
  try {
    const url = new URL(incomingURL, window.location.origin)

    if (!isAllowedURL(url)) {
      return undefined
    }

    return incomingURL.startsWith('http://') || incomingURL.startsWith('https://')
      ? incomingURL
      : url.href
  } catch {
    return undefined
  }
}
