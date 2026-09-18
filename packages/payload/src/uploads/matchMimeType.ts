import type { PayloadComponent } from '../config/types.js'

/**
 * Resolves a PayloadComponent from a MIME-type keyed map.
 *
 * Priority: exact match → category wildcard (e.g. `video/*`) → universal fallback (`*`).
 */
export function matchMimeType(
  map: Record<string, PayloadComponent>,
  mimeType: string,
): PayloadComponent | undefined {
  if (mimeType in map) {
    return map[mimeType]
  }
  const category = mimeType.split('/')[0]
  if (`${category}/*` in map) {
    return map[`${category}/*`]
  }
  if ('*' in map) {
    return map['*']
  }
  return undefined
}
