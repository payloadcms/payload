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

  // eslint-disable-next-line no-control-regex
  const cleaned = trimmed.replace(/[\x00-\x1f\x7f]/g, '')

  if (cleaned.startsWith('#')) {
    return cleaned
  }

  if (cleaned.startsWith('/') || cleaned.startsWith('./') || cleaned.startsWith('../')) {
    return cleaned
  }

  const protocolMatch = cleaned.match(/^([a-z][a-z0-9+\-.]*):(?=.)/i)
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

  return cleaned
}
