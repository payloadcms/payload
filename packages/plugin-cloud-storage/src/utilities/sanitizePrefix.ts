/**
 * Normalizes a storage prefix to ensure only valid path segments are included.
 */
export function sanitizePrefix(prefix: string): string {
  return (
    prefix
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment !== '..' && segment !== '.')
      .join('/')
      .replace(/^\/+/, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
  )
}
