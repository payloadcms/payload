const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

/**
 * @typedef {object} StoreEntry
 * @property {string} ref
 * @property {string} dependency
 * @property {string} to
 * @property {'declined' | 'failed'} outcome
 * @property {string} reason
 * @property {string} at ISO timestamp
 */

/** Returns [] for empty or invalid text. */
export function readStore({ text }) {
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed?.entries) ? parsed.entries.filter(isEntry) : []
  } catch {
    return []
  }
}

export function writeStore({ entries }) {
  return `${JSON.stringify({ entries }, null, 2)}\n`
}

/** Drops entries older than 30 days or dated after `now`. */
export function pruneStore({ entries, now = new Date() }) {
  return entries.filter((entry) => isFresh({ entry, now }))
}

export function findStoredOutcome({ entries, ref, dependency, to }) {
  return (
    entries.find(
      (entry) => entry.ref === ref && entry.dependency === dependency && entry.to === to,
    ) ?? null
  )
}

/** One entry per (ref, dependency, to); the newest wins. */
export function mergeStore({ entries, updates }) {
  const byKey = new Map()

  for (const entry of [...entries, ...updates]) {
    const key = [entry.ref, entry.dependency, entry.to].join('\0')
    const existing = byKey.get(key)
    if (!existing || Date.parse(entry.at) >= Date.parse(existing.at)) {
      byKey.set(key, entry)
    }
  }

  return [...byKey.values()]
}

/** Splits bumps into those with a fresh stored outcome and those to research. */
export function selectResearchBumps({ bumps, entries, ref, now = new Date() }) {
  const fresh = pruneStore({ entries, now })
  const research = []
  const stored = []

  for (const bump of bumps) {
    const entry = findStoredOutcome({
      entries: fresh,
      ref,
      dependency: bump.dependency,
      to: bump.to,
    })
    if (entry) {
      stored.push(entry)
    } else {
      research.push(bump)
    }
  }

  return { research, stored }
}

function isEntry(value) {
  return (
    Boolean(value) &&
    ['ref', 'dependency', 'to', 'outcome', 'reason', 'at'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    Number.isFinite(Date.parse(value.at))
  )
}

// A future date would keep a forged entry fresh forever, so it counts as expired.
function isFresh({ entry, now }) {
  const age = now.getTime() - Date.parse(entry.at)

  return age >= 0 && age <= EXPIRY_MS
}
