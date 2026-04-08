import { sanitizePrefix } from './sanitizePrefix.js'

type JoinPrefixesArgs = {
  /** Config-based prefix (developer controlled, not sanitized) */
  basePrefix?: string
  /** User-controlled prefix (sanitized for security) */
  prefix?: string
}

/**
 * Joins basePrefix and prefix into a single path.
 * Only sanitizes the user-controlled prefix, not the config-based basePrefix.
 */
export function joinPrefixes({ basePrefix, prefix }: JoinPrefixesArgs): string {
  const parts: string[] = []

  if (basePrefix) {
    parts.push(basePrefix)
  }

  if (prefix) {
    parts.push(sanitizePrefix(prefix))
  }

  return parts.join('/')
}
