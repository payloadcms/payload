/**
 * Normalizes a storage prefix to ensure only valid path segments are included.
 * Decodes URL-encoded input, rejects multi-encoded values, strips control characters.
 */
export function sanitizePrefix(prefix: string): string {
  let decodedPrefix: string

  try {
    decodedPrefix = decodeURIComponent(prefix)
  } catch {
    return ''
  }

  // Reject multi-encoded values (e.g. `%252f`) by allowing only a single decode pass.
  if (/%[0-9a-f]{2}/i.test(decodedPrefix)) {
    return ''
  }

  return (
    decodedPrefix
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment !== '..' && segment !== '.' && segment !== '')
      .join('/')
      .replace(/^\/+/, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
  )
}
