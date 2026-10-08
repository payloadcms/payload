/**
 * Normalizes a storage prefix for use in object keys and URLs.
 *
 * Decodes URI components once (so query-style `%2F` becomes `/`), rejects
 * values that still contain percent-encodings after decoding (e.g. `%252f`),
 * then removes control characters, normalizes slashes, drops `.` / `..` segments,
 * and strips leading slashes.
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
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment && segment !== '..' && segment !== '.')
      .join('/')
      .replace(/^\/+/, '')
  )
}
