/**
 * Checks whether a URL can be parsed without a base URL, regardless of protocol.
 * Typically used when validating HTTP(S) URLs.
 * Pair with `isAllowedURL` to restrict protocols to HTTP(S).
 */
export const isAbsoluteURL = (incomingURL?: string | URL): boolean => {
  if (!incomingURL) {
    return false
  }

  if (incomingURL instanceof URL) {
    return true
  }

  try {
    new URL(incomingURL)
    return true
  } catch {
    return false
  }
}
