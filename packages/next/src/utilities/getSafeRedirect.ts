export const getSafeRedirect = (
  redirectParam: string | string[],
  fallback: string = '/',
): string => {
  if (typeof redirectParam !== 'string') {
    return fallback
  }

  // Ensures that any leading or trailing whitespace doesn’t affect the checks
  const redirectPath = redirectParam.trim()

  const isSafeRedirect =
    // Must start with a single forward slash (e.g., "/admin")
    redirectPath.startsWith('/') &&
    // Prevent protocol-relative URLs (e.g., "//evil.com")
    !redirectPath.startsWith('//') &&
    // Prevent javascript-based schemes (e.g., "/javascript:alert(1)")
    !redirectPath.toLowerCase().startsWith('/javascript:') &&
    // Prevent attempts to redirect to full URLs using "/http:" or "/https:"
    !redirectPath.toLowerCase().startsWith('/http')

  return isSafeRedirect ? redirectPath : fallback
}
