/**
 * The prerelease identifiers this release flow is allowed to publish, and the
 * single source of truth for both the bump preconditions and the publish gate.
 * Anything outside this set (a stable version, or an `internal`/`rc`/unknown
 * prerelease line) must be rejected rather than defaulted — extend this list to
 * onboard a new publishable line.
 */
export const PREIDS = ['beta', 'canary'] as const

export type Preid = (typeof PREIDS)[number]

export const isPreid = (value: unknown): value is Preid =>
  typeof value === 'string' && (PREIDS as readonly string[]).includes(value)
