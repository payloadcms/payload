/**
 * Sanitizes a URL to ensure only allowed protocols are used.
 * Allows: http, https, mailto, tel, relative paths, and fragment (#) URLs.
 * Returns '#' for any URL with a disallowed protocol (e.g. javascript:, data:).
 */
export function sanitizeUrl(url: string): string {
  if (!url) {
    return ''
  }

  const trimmed = url.trim()

  // Allow fragment-only URLs
  if (trimmed.startsWith('#')) {
    return trimmed
  }

  // Allow relative URLs (no protocol)
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed
  }

  // Check for protocol — use a lookahead (:(?=.)) so bare "mailto:" with nothing after is rejected
  const protocolMatch = trimmed.match(/^([a-z][a-z0-9+\-.]*):(?=.)/i)
  if (protocolMatch) {
    const protocol = protocolMatch[1]!.toLowerCase()
    if (
      protocol !== 'http' &&
      protocol !== 'https' &&
      protocol !== 'mailto' &&
      protocol !== 'tel'
    ) {
      return '#'
    }
  }

  return trimmed
}
