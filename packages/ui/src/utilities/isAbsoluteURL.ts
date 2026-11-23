/** Checks whether a URL is absolute or relative. */
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
