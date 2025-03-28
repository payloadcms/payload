export const getSafeRedirect = (
  redirectParam: string | string[],
  fallback: string = '/',
): string => {
  if (typeof redirectParam !== 'string') {
    return fallback
  }

  // Normalize and decode the path
  let redirectPath: string
  try {
    redirectPath = decodeURIComponent(redirectParam.trim())
  } catch {
    return fallback // invalid encoding
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

  return isSafeRedirect ? redirectPath : fallback
}
