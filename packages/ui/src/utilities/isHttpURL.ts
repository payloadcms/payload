/** Allows only HTTP(S) URLs, e.g. `http://` or `https://`. */
export const isHttpURL = (incomingURL?: string | URL): boolean => {
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
