/**
 * Normalizes a storage prefix for use in object keys and URLs.
 *
 * Decodes URI components once (so query-style `%2F` becomes `/`), rejects
 * values that still contain a `%` after decoding (e.g. `%252f` or `%25`),
 * then removes control characters, normalizes slashes, drops `.` / `..` segments,
 * and strips leading slashes.
 *
 * Sanitizing an already sanitized prefix returns it unchanged.
 */
export function sanitizePrefix(prefix: string): string {
  let decodedPrefix: string

  try {
    decodedPrefix = decodeURIComponent(prefix)
  } catch {
    return ''
  }

  // Allow a single decode pass only. A `%` left over could be decoded again later.
  if (decodedPrefix.includes('%')) {
    return ''
  }

  return (
    decodedPrefix
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment && segment !== '..' && segment !== '.')
      .join('/')
      .replace(/^\/+/, '')
  )
}
