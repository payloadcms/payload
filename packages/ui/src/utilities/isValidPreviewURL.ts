/**
 * Validates an HTTP(S) preview URL without changing its formatting.
 * String inputs must be nonempty and require the client to resolve relative URLs against the admin origin.
 * Parsed URLs can be passed to avoid resolving the same input twice.
 */
export const isValidPreviewURL = (incomingURL?: string | URL): boolean => {
  if (!incomingURL) {
    return false
  }

  try {
    const url =
      typeof incomingURL === 'string' ? new URL(incomingURL, window.location.origin) : incomingURL

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
