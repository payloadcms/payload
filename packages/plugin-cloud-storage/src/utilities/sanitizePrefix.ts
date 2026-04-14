/**
 * Normalizes a storage prefix for use in object keys and URLs.
 *
 * Decodes URI components once (so query-style `%2F` becomes `/`), rejects
 * values that still contain percent-encodings after decoding (e.g. `%252f`),
 * then normalizes slashes, drops `.` / `..` segments, strips leading slashes,
 * and removes control characters.
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
      .filter((segment) => segment !== '..' && segment !== '.')
      .join('/')
      .replace(/^\/+/, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
  )
}
