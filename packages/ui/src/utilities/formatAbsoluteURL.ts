import { isHttpURL } from './isHttpURL.js'

/**
 * Ensures the provided URL is absolute. If not, it converts it to an absolute URL based
 * on the current window location.
 * Note: This MUST be called within the client environment as it relies on the `window` object
 * to determine the absolute URL.
 */
export const formatAbsoluteURL = (incomingURL: string): string | undefined => {
  try {
    // This throws for malformed URLs, e.g. `https://[wrong`.
    // Preformed absolute URLs ignore `window.location.origin` when parsed.
    const parsedURL = new URL(incomingURL, window.location.origin)

    // If the given URL is already absolute, preserve its original format exactly, i.e. `new URL()` may have added a trailing slash
    if (incomingURL.startsWith('http://') || incomingURL.startsWith('https://')) {
      return incomingURL
    }

    if (isHttpURL(parsedURL)) {
      return parsedURL.href
    }

    return undefined
  } catch {
    return undefined
  }
}
