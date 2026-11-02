/**
 * Normalizes a storage prefix to the canonical path used by upload adapters.
 */
export function sanitizeUploadPrefix(prefix: string): string {
  let decodedPrefix: string

  try {
    decodedPrefix = decodeURIComponent(prefix)
  } catch {
    return ''
  }

  // Reject multi-encoded values (e.g. `%252f`) by allowing only one decode pass.
  if (/%[0-9a-f]{2}/i.test(decodedPrefix)) {
    return ''
  }

  return (
    decodedPrefix
      .replace(/\\/g, '/')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .split('/')
      .filter((segment) => segment && segment !== '..' && segment !== '.')
      .join('/')
  )
}
