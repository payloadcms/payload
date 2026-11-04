const BOT_LOGIN = 'github-actions[bot]'
const FINGERPRINT_PATTERN = /<!-- audit-deps: (.*?) -->/g
const GROUP_PR_ID = 'non-major'

/**
 * @typedef {object} Fingerprint
 * @property {string} prId
 * @property {Array<[string, string]>} bumps [dependency, target version] pairs
 * @property {string[]} advisories
 *
 * @typedef {object} PrState
 * @property {Fingerprint | null} fingerprint
 * @property {boolean} hasForeignCommits
 * @property {boolean} [isConflicted] true when GitHub reports `mergeable_state: 'dirty'`, which
 *   means the PR has merge conflicts
 *
 * @typedef {'dry-run' | 'create' | 'update' | 'skip' | 'skip-rejected' | 'blocked'} PrStep
 */

export function formatFingerprint({ fingerprint }) {
  const sorted = {
    prId: fingerprint.prId,
    bumps: [...fingerprint.bumps].sort(compareBumpPairs),
    advisories: [...fingerprint.advisories].sort(),
  }

  return `<!-- audit-deps: ${JSON.stringify(sorted)} -->`
}

/**
 * Returns the last fingerprint in the body. The bot writes its fingerprint at the end, so a
 * fingerprint that someone adds higher in the body cannot replace it.
 */
export function parseFingerprint({ body }) {
  const matches = [...(body ?? '').matchAll(FINGERPRINT_PATTERN)]
  const last = matches.at(-1)
  if (!last) {
    return null
  }

  try {
    const parsed = JSON.parse(last[1])
    if (!isFingerprint({ value: parsed })) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function fingerprintForPr({ pr, bumps }) {
  const advisories = [...new Set(bumps.flatMap((bump) => bump.advisories))].sort()

  return {
    prId: pr.id,
    bumps: bumps.map((bump) => [bump.dependency, bump.to]).sort(compareBumpPairs),
    advisories,
  }
}

/**
 * Decides the step for one planned PR. `rejectedPr` is a PR that a person closed without a
 * merge. It stops a new PR only when its fingerprint matches the planned change; for a major PR,
 * that means the same dependency, target major and advisories. An open PR with merge conflicts
 * is rebuilt on the current base, even when its fingerprint matches.
 * @returns {PrStep}
 */
export function decidePrStep({ fingerprint, openPr, rejectedPr }) {
  if (!openPr) {
    return rejectedPr?.fingerprint &&
      isRejectionMatch({ fingerprint, rejected: rejectedPr.fingerprint })
      ? 'skip-rejected'
      : 'create'
  }

  if (
    !openPr.isConflicted &&
    openPr.fingerprint &&
    isSameFingerprint({ a: openPr.fingerprint, b: fingerprint })
  ) {
    return 'skip'
  }

  return openPr.hasForeignCommits ? 'blocked' : 'update'
}

/** Returns the numbers of open PRs on this ref's audit branches that no planned PR uses. */
export function findStalePrs({ openPrs, prs, ref }) {
  const prefix = `ci/audit-deps-fix-${ref}-`
  const branches = new Set(prs.map((pr) => pr.branch))

  return openPrs
    .filter((pr) => pr.branch.startsWith(prefix) && !branches.has(pr.branch))
    .map((pr) => pr.number)
}

export function hasForeignCommits({ commits }) {
  return commits.some(
    (commit) => commit.author?.login !== BOT_LOGIN || commit.committer?.login !== BOT_LOGIN,
  )
}

function isFingerprint({ value }) {
  return (
    Boolean(value) &&
    typeof value.prId === 'string' &&
    Array.isArray(value.bumps) &&
    value.bumps.every(
      (pair) =>
        Array.isArray(pair) && pair.length === 2 && pair.every((v) => typeof v === 'string'),
    ) &&
    Array.isArray(value.advisories) &&
    value.advisories.every((id) => typeof id === 'string')
  )
}

function compareBumpPairs(a, b) {
  return `${a[0]}\0${a[1]}`.localeCompare(`${b[0]}\0${b[1]}`)
}

function isSameFingerprint({ a, b }) {
  return (
    a.prId === b.prId &&
    isSameList({ a: a.advisories, b: b.advisories }) &&
    isSameList({
      a: a.bumps.map((pair) => pair.join('\0')),
      b: b.bumps.map((pair) => pair.join('\0')),
    })
  )
}

function isRejectionMatch({ fingerprint, rejected }) {
  if (fingerprint.prId !== rejected.prId) {
    return false
  }

  if (fingerprint.prId === GROUP_PR_ID) {
    return isSameFingerprint({ a: fingerprint, b: rejected })
  }

  const [dependency, to] = fingerprint.bumps[0] ?? []
  const [rejectedDependency, rejectedTo] = rejected.bumps[0] ?? []

  return (
    dependency !== undefined &&
    dependency === rejectedDependency &&
    majorOf({ version: to }) === majorOf({ version: rejectedTo }) &&
    isSameList({ a: fingerprint.advisories, b: rejected.advisories })
  )
}

function majorOf({ version }) {
  return String(version).split('.')[0]
}

function isSameList({ a, b }) {
  const left = [...a].sort()
  const right = [...b].sort()

  return left.length === right.length && left.every((value, i) => value === right[i])
}
