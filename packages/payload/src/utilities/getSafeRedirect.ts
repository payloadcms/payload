export const getSafeRedirect = ({
  allowAbsoluteUrls = false,
  fallbackTo = '/',
  redirectTo,
}: {
  allowAbsoluteUrls?: boolean
  fallbackTo?: string
  redirectTo: string | string[]
}): string => {
  if (typeof redirectTo !== 'string') {
    return fallbackTo
  }

  const redirectPath = redirectTo.trim()

  // Reject raw control characters
  const hasControlCharacters = [...redirectPath].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  // Reject ambiguous (possibly nested) percent-encoded path prefixes
  const hasAmbiguousPathPrefix = /^\/%(?:25)*(?:09|0a|0d|2f|5c)/i.test(redirectPath)

  let parsedRedirect: URL
  try {
    parsedRedirect = new URL(redirectPath, 'http://localhost')
  } catch {
    return fallbackTo
  }

  const isSafeRedirect =
    !hasControlCharacters &&
    !hasAmbiguousPathPrefix &&
    // Must start with a single forward slash (e.g., "/admin")
    redirectPath.startsWith('/') &&
    // Must resolve to the same origin after URL parser normalization
    parsedRedirect.origin === 'http://localhost' &&
    // Prevent protocol-relative URLs (e.g., "//example.com")
    !redirectPath.startsWith('//') &&
    // Prevent encoded slashes that could resolve to protocol-relative
    !redirectPath.startsWith('/%2F') &&
    // Prevent backslash-based escape attempts (e.g., "/\\/example.com", "/\\\\example.com", "/\\example.com")
    !redirectPath.startsWith('/\\/') &&
    !redirectPath.startsWith('/\\\\') &&
    !redirectPath.startsWith('/\\') &&
    // Prevent javascript-based schemes (e.g., "/javascript:alert(1)")
    !redirectPath.toLowerCase().startsWith('/javascript:') &&
    // Prevent attempts to redirect to full URLs using "/http:" or "/https:"
    !redirectPath.toLowerCase().startsWith('/http')

  const isAbsoluteSafeRedirect =
    allowAbsoluteUrls &&
    !hasControlCharacters &&
    // Must be a valid absolute URL with http or https
    /^https?:\/\/\S+$/i.test(redirectPath) &&
    (parsedRedirect.protocol === 'http:' || parsedRedirect.protocol === 'https:')

  return isSafeRedirect || isAbsoluteSafeRedirect ? redirectPath : fallbackTo
}
