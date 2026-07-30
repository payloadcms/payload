/**
 * Reproduces the truncate-and-increment behavior of the historical
 * `buildIndexName` and `buildForeignKeyName` utilities.
 *
 * Used by `getIdentifier` in legacy mode (`adapter.shouldCompressIdentifiers`
 * is false) for indexes and foreign keys — the two identifier types that
 * previously had truncation. Tables, enums, and columns bypass this helper
 * and use plain concat + warn instead, matching their pre-refactor behavior.
 *
 * Algorithm:
 * 1. Concatenate `body + _<n> + suffix` (when `n > 0`, otherwise `body + suffix`).
 * 2. If the result exceeds 60 chars, truncate the body so the final string is
 *    exactly 60 chars. The 60-char threshold (vs. Postgres' 63-char cap) is
 *    historical — `buildIndexName` used the same margin and users' deployed
 *    indexes depend on it.
 * 3. On collision with an existing tracker entry, increment `n` and recurse.
 *
 * The disambiguation number `_<n>` is spliced BETWEEN `body` and `suffix` so
 * the result matches historical `buildIndexName({ appendSuffix: true })` output
 * (e.g. `posts_title_1_idx`, not `posts_title_idx_1`). Migration stability
 * depends on this ordering.
 *
 * Cross-type collision detection (e.g. an index name colliding with a table)
 * is the caller's responsibility — `getIdentifier` keeps a scope-aware map
 * above this layer and throws before or after invoking `legacyTruncate`.
 *
 * @mutates tracker - Adds the returned identifier.
 */
export const legacyTruncate = ({
  blockedNames,
  body,
  number = 0,
  suffix = '',
  tracker,
}: {
  /**
   * Additional names to avoid, e.g. existing table names when building an
   * index. Matches pre-refactor `buildIndexName` which checked both
   * `adapter.indexes` and `adapter.rawTables` — a truncated index name that
   * collapses to a table name must disambiguate via `_<n>`, since Postgres
   * shares the relation namespace between tables and indexes.
   */
  blockedNames?: ReadonlySet<string>
  body: string
  number?: number
  suffix?: string
  tracker: Set<string>
}): string => {
  const numberSuffix = number ? `_${number}` : ''
  const trailing = `${numberSuffix}${suffix}`
  let candidate = `${body}${trailing}`

  if (candidate.length > 60) {
    candidate = `${body.slice(0, 60 - trailing.length)}${trailing}`
  }

  if (!tracker.has(candidate) && !blockedNames?.has(candidate)) {
    tracker.add(candidate)
    return candidate
  }

  return legacyTruncate({ blockedNames, body, number: number + 1, suffix, tracker })
}
