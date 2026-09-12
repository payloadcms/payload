/**
 * Sanitizes URLs for safe usage in href attributes.
 * Allows valid internal relative paths (e.g., '/posts/test') and HTTP/HTTPS URLs.
 * Rejects protocol-relative URLs (e.g., '//external.example'), javascript:, data:, and malformed values.
 */
export function safeHref(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Reject backslashes or protocol-relative variations (e.g., //, /\, \\)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return null
  }

  // Validate internal relative paths
  if (trimmed.startsWith('/')) {
    try {
      const parsed = new URL(trimmed, 'http://localhost')
      if (parsed.origin !== 'http://localhost') return null
      return trimmed
    } catch {
      return null
    }
  }

  // Validate absolute URLs
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null
  } catch {
    return null
  }
}
