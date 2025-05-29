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

  // Normalize and decode the path
  let redirectPath: string
  try {
    redirectPath = decodeURIComponent(redirectTo.trim())
  } catch {
    return fallbackTo // invalid encoding
  }

  const isSafeRedirect =
    // Must start with a single forward slash (e.g., "/admin")
    redirectPath.startsWith('/') &&
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
    // Must be a valid absolute URL with http or https
    /^https?:\/\/\S+$/i.test(redirectPath)

  return isSafeRedirect || isAbsoluteSafeRedirect ? redirectPath : fallbackTo
}
