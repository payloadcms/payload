/**
 * Sanitizes URLs for safe usage in href attributes.
 * Allows valid internal relative paths (e.g., '/posts/test') and HTTP/HTTPS URLs.
 * Rejects protocol-relative URLs (e.g., '//external.example'), javascript:, data:, and malformed values.
 */
export function safeHref(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Reject protocol-relative URLs
  if (trimmed.startsWith('//')) return null

  // Allow internal relative paths
  if (trimmed.startsWith('/')) return trimmed

  // Validate absolute URLs
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null
  } catch {
    return null
  }
}
