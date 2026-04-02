const getAbsoluteUrl = (url) => {
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

/**
 * Ensures the provided URL is absolute. If not, it converts it to an absolute URL based
 * on the current window location.
 * Note: This MUST be called within the client environment as it relies on the `window` object
 * to determine the absolute URL.
 */
export const formatAbsoluteURL = (incomingURL: string) =>
  incomingURL?.startsWith('http://') || incomingURL?.startsWith('https://')
    ? incomingURL
    : getAbsoluteUrl(incomingURL)
