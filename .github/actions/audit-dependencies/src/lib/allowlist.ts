import { readFile } from 'node:fs/promises'

import type { Scope } from '../types'

export type AllowlistEntry = {
  /** GitHub advisory ID; the unit `pnpm audit --ignore` accepts. */
  advisory: string
  /** `monorepo`, `consumer`, or `both`. */
  appliesTo: 'both' | 'consumer' | 'monorepo'
  /** ISO date (YYYY-MM-DD). An entry past this date fails the run. */
  expires: string
  /** Vulnerable module name, for readability. */
  package?: string
  /** Why this advisory is safe to ignore for the given scope. */
  rationale: string
}

export type LoadedAllowlist = {
  /** GHSAs active for the current scope (non-expired, scope-matched). */
  activeGhsas: string[]
  entries: AllowlistEntry[]
}

export type AllowlistResult =
  | { allowlist: LoadedAllowlist; ok: true }
  | { error: string; kind: 'config'; ok: false } // exit 2
  | { error: string; kind: 'expired'; ok: false } // exit 1

const APPLIES_TO_VALUES: ReadonlyArray<AllowlistEntry['appliesTo']> = [
  'monorepo',
  'consumer',
  'both',
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const GHSA_PATTERN = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i

/**
 * Loads the committed allowlist. A missing file is valid (empty allowlist).
 * Malformed content is a config error (exit 2); an expired entry fails the run
 * (exit 1) so exceptions get re-reviewed rather than silently rotting.
 */
export const loadAllowlist = async ({
  path,
  scope,
  today,
}: {
  path: string
  scope: Scope
  today: Date
}): Promise<AllowlistResult> => {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    return { allowlist: { activeGhsas: [], entries: [] }, ok: true }
  }

  const parsed = parseAllowlist(raw)
  if (!parsed.ok) {
    return { error: parsed.error, kind: 'config', ok: false }
  }

  const expired = parsed.entries.filter((entry) => isExpired(entry.expires, today))
  if (expired.length > 0) {
    const list = expired.map((entry) => `${entry.advisory} (expired ${entry.expires})`).join(', ')
    return {
      error: `allowlist entries expired; re-review required: ${list}`,
      kind: 'expired',
      ok: false,
    }
  }

  const scopeKey = scope === 'monorepo' ? 'monorepo' : 'consumer'
  const activeGhsas = parsed.entries
    .filter((entry) => entry.appliesTo === 'both' || entry.appliesTo === scopeKey)
    .map((entry) => entry.advisory)

  return { allowlist: { activeGhsas, entries: parsed.entries }, ok: true }
}

const parseAllowlist = (
  raw: string,
): { entries: AllowlistEntry[]; ok: true } | { error: string; ok: false } => {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: `allowlist is not valid JSON: ${message}`, ok: false }
  }

  if (!isRecord(data) || !Array.isArray(data.entries)) {
    return { error: 'allowlist must be an object with an "entries" array', ok: false }
  }

  const entries: AllowlistEntry[] = []
  for (let index = 0; index < data.entries.length; index++) {
    const result = parseEntry(data.entries[index], index)
    if (!result.ok) {
      return result
    }
    entries.push(result.entry)
  }

  return { entries, ok: true }
}

const parseEntry = (
  value: unknown,
  index: number,
): { entry: AllowlistEntry; ok: true } | { error: string; ok: false } => {
  const at = `allowlist entry ${index}`
  if (!isRecord(value)) {
    return { error: `${at} must be an object`, ok: false }
  }

  const { advisory, appliesTo, expires, package: pkg, rationale } = value

  if (typeof advisory !== 'string' || !GHSA_PATTERN.test(advisory)) {
    return { error: `${at} has an invalid "advisory" (expected a GHSA id)`, ok: false }
  }
  if (typeof rationale !== 'string' || rationale.trim() === '') {
    return { error: `${at} (${advisory}) is missing a "rationale"`, ok: false }
  }
  if (!isAppliesTo(appliesTo)) {
    return {
      error: `${at} (${advisory}) has an invalid "appliesTo" (expected monorepo|consumer|both)`,
      ok: false,
    }
  }
  if (typeof expires !== 'string' || !DATE_PATTERN.test(expires)) {
    return {
      error: `${at} (${advisory}) has an invalid "expires" (expected YYYY-MM-DD)`,
      ok: false,
    }
  }
  if (pkg !== undefined && typeof pkg !== 'string') {
    return { error: `${at} (${advisory}) has an invalid "package"`, ok: false }
  }

  return { entry: { advisory, appliesTo, expires, package: pkg, rationale }, ok: true }
}

/** ISO dates sort lexicographically, so a string compare is timezone-safe. */
const isExpired = (expires: string, today: Date): boolean =>
  expires < today.toISOString().slice(0, 10)

const isAppliesTo = (value: unknown): value is AllowlistEntry['appliesTo'] =>
  typeof value === 'string' && APPLIES_TO_VALUES.some((allowed) => allowed === value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
