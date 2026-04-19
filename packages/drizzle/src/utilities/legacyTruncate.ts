import type { IdentifierType } from './getIdentifier.types.js'

/**
 * Reproduces the truncate-and-increment behavior of the historical
 * `buildIndexName` and `buildForeignKeyName` utilities.
 *
 * Used by `getIdentifier` when `adapter.shouldCompressIdentifiers` is false,
 * so existing users see no behavioral change until they opt into compression.
 *
 * The disambiguation number `_<n>` is spliced BETWEEN `body` and `suffix` so
 * the result matches historical `buildIndexName({ appendSuffix: true })` output
 * (e.g. `posts_title_1_idx`, not `posts_title_idx_1`). Migration stability
 * depends on this ordering for users who upgrade without enabling compression.
 *
 * @mutates tracker - Registers the returned identifier with its `type`.
 * @throws When `candidate` is already present in `tracker` with a different
 *   `type` (cross-type collision). Same-type collisions increment `_<n>`
 *   and recurse.
 */
export const legacyTruncate = ({
  type,
  body,
  maxLength,
  number = 0,
  suffix = '',
  tracker,
}: {
  body: string
  maxLength: number
  number?: number
  suffix?: string
  tracker: Map<string, IdentifierType>
  type: IdentifierType
}): string => {
  const numberSuffix = number ? `_${number}` : ''
  const trailing = `${numberSuffix}${suffix}`
  let candidate = `${body}${trailing}`

  // Historical threshold: buildIndexName/buildForeignKeyName truncate at 60,
  // leaving a handful of chars below the Postgres 63 cap as a safety margin.
  const truncateAt = Math.min(60, maxLength)
  if (candidate.length > truncateAt) {
    candidate = `${body.slice(0, truncateAt - trailing.length)}${trailing}`
  }

  const existing = tracker.get(candidate)
  if (!existing) {
    tracker.set(candidate, type)
    return candidate
  }
  if (existing !== type) {
    throw new Error(
      `Identifier collision: "${candidate}" requested as ${type}, but already exists as ` +
        `${existing} (from "${body}${suffix}"). Consider setting \`dbName\` on the entity ` +
        `or enabling \`shouldCompressIdentifiers\` on the adapter.`,
    )
  }
  return legacyTruncate({ type, body, maxLength, number: number + 1, suffix, tracker })
}
