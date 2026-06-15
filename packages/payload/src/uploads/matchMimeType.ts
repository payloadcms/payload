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
  if (map[mimeType]) {
    return map[mimeType]
  }
  const category = mimeType.split('/')[0]
  if (map[`${category}/*`]) {
    return map[`${category}/*`]
  }
  return map['*']
}
