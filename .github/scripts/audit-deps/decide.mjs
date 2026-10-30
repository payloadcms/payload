const BOT_LOGIN = 'github-actions[bot]'
const MARKER_PATTERN = /<!-- audit-deps: (.*?) -->/g
const GROUP_UNIT_ID = 'non-major'

/**
 * @typedef {object} Marker
 * @property {string} unit
 * @property {Array<[string, string]>} bumps [dependency, to] pairs
 * @property {string[]} advisories
 *
 * @typedef {object} PrState
 * @property {Marker | null} marker
 * @property {boolean} hasForeignCommits
 * @property {boolean} [isConflicted] GitHub reports `mergeable_state: 'dirty'`
 *
 * @typedef {'dry-run' | 'create' | 'update' | 'skip' | 'skip-rejected' | 'blocked'} UnitStep
 */

export function formatMarker({ marker }) {
  const sorted = {
    unit: marker.unit,
    bumps: [...marker.bumps].sort(compareBumpPairs),
    advisories: [...marker.advisories].sort(),
  }

  return `<!-- audit-deps: ${JSON.stringify(sorted)} -->`
}

/** Returns the last marker in the body, so an earlier forged marker cannot win. */
export function parseMarker({ body }) {
  const matches = [...(body ?? '').matchAll(MARKER_PATTERN)]
  const last = matches.at(-1)
  if (!last) {
    return null
  }

  try {
    const parsed = JSON.parse(last[1])
    if (!isMarker(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function markerForUnit({ unit, bumps }) {
  const advisories = [...new Set(bumps.flatMap((bump) => bump.advisories))].sort()

  return {
    unit: unit.id,
    bumps: bumps.map((bump) => [bump.dependency, bump.to]).sort(compareBumpPairs),
    advisories,
  }
}

/**
 * Decides what to do for one unit. A closed-unmerged PR (`rejectedPr`) only blocks
 * recreation while its marker still describes the same change. A conflicted open PR is
 * rebuilt on the current base even when its marker is unchanged.
 * @returns {UnitStep}
 */
export function decideUnitStep({ isDefaultInputs, marker, openPr, rejectedPr }) {
  if (!isDefaultInputs) {
    return 'dry-run'
  }

  if (!openPr) {
    return rejectedPr?.marker && isRejectionMatch({ marker, rejected: rejectedPr.marker })
      ? 'skip-rejected'
      : 'create'
  }

  if (!openPr.isConflicted && openPr.marker && isSameMarker({ a: openPr.marker, b: marker })) {
    return 'skip'
  }

  return openPr.hasForeignCommits ? 'blocked' : 'update'
}

/** Open bot PRs whose branch under this ref's prefix matches no unit. */
export function findStalePrs({ openPrs, ref, units }) {
  const prefix = `ci/audit-deps-fix-${ref}-`
  const branches = new Set(units.map((unit) => unit.branch))

  return openPrs
    .filter((pr) => pr.branch.startsWith(prefix) && !branches.has(pr.branch))
    .map((pr) => pr.number)
}

export function hasForeignCommits({ commits }) {
  return commits.some(
    (commit) => commit.author?.login !== BOT_LOGIN || commit.committer?.login !== BOT_LOGIN,
  )
}

function isMarker(value) {
  return (
    Boolean(value) &&
    typeof value.unit === 'string' &&
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

function isSameMarker({ a, b }) {
  return (
    a.unit === b.unit &&
    isSameList({ a: a.advisories, b: b.advisories }) &&
    isSameList({
      a: a.bumps.map((pair) => pair.join('\0')),
      b: b.bumps.map((pair) => pair.join('\0')),
    })
  )
}

function isRejectionMatch({ marker, rejected }) {
  if (marker.unit !== rejected.unit) {
    return false
  }

  if (marker.unit === GROUP_UNIT_ID) {
    return isSameMarker({ a: marker, b: rejected })
  }

  const [dependency, to] = marker.bumps[0] ?? []
  const [rejectedDependency, rejectedTo] = rejected.bumps[0] ?? []

  return (
    dependency !== undefined &&
    dependency === rejectedDependency &&
    majorOf({ version: to }) === majorOf({ version: rejectedTo }) &&
    isSameList({ a: marker.advisories, b: rejected.advisories })
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
