/**
 * Normalizes a single prefix segment, removing dangerous path components.
 */
function normalizePrefix(prefix: string | undefined): string {
  if (!prefix) {
    return ''
  }
  return prefix
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment !== '..' && segment !== '.' && segment !== '')
    .join('/')
}

/**
 * Joins multiple prefix segments into a single normalized path.
 * Handles empty/undefined values and normalizes each segment.
 */
export function joinPrefixes(...prefixes: (string | undefined)[]): string {
  const normalized = prefixes.map(normalizePrefix).filter(Boolean)
  return normalized.length ? normalized.join('/') : ''
}
