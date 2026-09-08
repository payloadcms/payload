/** Checks whether a URL can be parsed without a base URL, regardless of protocol. */
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
