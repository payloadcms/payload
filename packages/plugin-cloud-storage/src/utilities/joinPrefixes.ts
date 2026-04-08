import { sanitizePrefix } from './sanitizePrefix.js'

type PrefixItem =
  | {
      prefix: string | undefined
      /** @default true */
      sanitize?: boolean
    }
  | string

/**
 * Joins multiple prefix segments into a single path.
 *
 * - String items are sanitized by default (safe for user-controlled input)
 * - Object items with `sanitize: false` skip sanitization (for config-controlled values)
 *
 * @example
 * // Adapter prefix (trusted) + document prefix (user-controlled)
 * joinPrefixes([
 *   { prefix: basePrefix, sanitize: false },
 *   documentPrefix,
 * ])
 */
export function joinPrefixes(items: PrefixItem[]): string {
  const parts: string[] = []

  for (const item of items) {
    if (!item) {
      continue
    }

    const prefix = typeof item === 'string' ? item : item.prefix
    const shouldSanitize = typeof item === 'string' ? true : (item.sanitize ?? true)

    if (!prefix) {
      continue
    }

    parts.push(shouldSanitize ? sanitizePrefix(prefix) : prefix)
  }

  return parts.join('/')
}
