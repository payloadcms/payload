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
 * recreation while its marker still describes the same change.
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

  if (openPr.marker && isSameMarker({ a: openPr.marker, b: marker })) {
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

/**
 * Picks the next pipeline step. Closing a bot PR without merging means "ignore this
 * advisory set", so a rejected PR only blocks recreation while the fixable set is unchanged.
 */
export function decideNextStep({ fixable, isDefaultInputs, openPr, rejectedPr }) {
  const hasFixable = fixable.length > 0

  if (!isDefaultInputs) {
    return hasFixable ? 'dry-run' : 'none'
  }

  if (!hasFixable) {
    return openPr ? 'close' : 'none'
  }

  if (!openPr) {
    return isSameSet({ advisories: rejectedPr?.advisories, fixable }) ? 'skip' : 'create'
  }

  if (isSameSet({ advisories: openPr.advisories, fixable })) {
    return 'skip'
  }

  return openPr.hasForeignCommits ? 'blocked' : 'update'
}

export function hasForeignCommits({ commits }) {
  return commits.some((commit) => commit.author?.login !== BOT_LOGIN)
}

// A missing marker (null) never matches, so edited PR bodies are regenerated, not skipped.
function isSameSet({ advisories, fixable }) {
  if (!advisories) {
    return false
  }

  const expected = [...new Set(fixable)].sort()
  const actual = [...new Set(advisories)].sort()

  return expected.length === actual.length && expected.every((value, i) => value === actual[i])
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
