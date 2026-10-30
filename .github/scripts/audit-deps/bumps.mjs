/**
 * @typedef {object} Bump
 * @property {string} id `<slug>-<toMajor>`, with a `-fallback` suffix for non-major replacements
 * @property {string} dependency
 * @property {string} from spec as declared, e.g. '^9.5.0', 'catalog:'
 * @property {string} fromVersion lowest version in `from`; '' when it cannot be read from the spec
 * @property {string} to target version
 * @property {boolean} isMajor
 * @property {string[]} manifests repo-relative package.json paths
 * @property {string[]} advisories sorted GHSA ids whose finding lists this dependency in bumps[]
 * @property {string | null} fallbackFor id of the major bump this non-major replaces if declined
 *
 * @typedef {object} Unit
 * @property {string} id
 * @property {'group' | 'major'} kind
 * @property {string} branch
 * @property {string[]} bumpIds
 *
 * @typedef {object} NoFix
 * @property {string} advisory
 * @property {string} severity
 * @property {string} module
 * @property {string[]} through
 * @property {string[]} affects
 * @property {string} reason
 */

const CONSUMER_RELOCK_REASON = 'Needs an override or relock; consumers do not get our overrides.'
const MONOREPO_RELOCK_REASON = 'Not handled: needs a relock or override.'

export function slugDependency({ dependency }) {
  return dependency
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

/** Compares major.minor.patch; negative when `a` is lower. */
export function compareVersions({ a, b }) {
  const partsA = a.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0)
  const partsB = b.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0)

  for (let index = 0; index < 3; index++) {
    const difference = (partsA[index] ?? 0) - (partsB[index] ?? 0)
    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

/**
 * One bump per dependency, aimed at the highest fix version across its findings.
 * A major bump gets a non-major fallback only when some finding is fixed within the current major.
 * Only `fix` entries produce bumps. Throws when two dependencies slug to the same bump id.
 *
 * @returns {Bump[]}
 */
export function buildBumps({ report }) {
  const entriesByDependency = new Map()

  for (const finding of report.findings) {
    for (const entry of finding.bumps) {
      if (entry.fix?.status !== 'fix') {
        continue
      }

      const entries = entriesByDependency.get(entry.dependency) ?? []
      entries.push({
        advisory: finding.advisory,
        currentSpec: entry.currentSpec,
        fromMajor: entry.fix.fromMajor,
        version: entry.fix.version,
      })
      entriesByDependency.set(entry.dependency, entries)
    }
  }

  const bumps = [...entriesByDependency].flatMap(([dependency, entries]) =>
    bumpsForDependency({ dependency, entries, report }),
  )
  assertUniqueIds({ bumps })

  return bumps.sort((a, b) => a.dependency.localeCompare(b.dependency) || a.id.localeCompare(b.id))
}

/**
 * The non-major group unit comes first, then one unit per major bump by dependency name.
 *
 * @returns {Unit[]}
 */
export function buildUnits({ bumps, ref }) {
  const groupBumpIds = bumps.filter((bump) => !bump.isMajor).map((bump) => bump.id)
  const units = []

  if (groupBumpIds.length > 0) {
    units.push({
      id: 'non-major',
      kind: 'group',
      branch: branchFor({ ref, suffix: 'non-major' }),
      bumpIds: groupBumpIds,
    })
  }

  const majors = bumps
    .filter((bump) => bump.isMajor)
    .sort((a, b) => a.dependency.localeCompare(b.dependency) || a.id.localeCompare(b.id))

  for (const bump of majors) {
    units.push({
      id: bump.id,
      kind: 'major',
      branch: branchFor({ ref, suffix: bump.id }),
      bumpIds: [bump.id],
    })
  }

  return units
}

/**
 * Findings that no bump can clear.
 *
 * @returns {NoFix[]}
 */
export function listNoFix({ report, scope }) {
  return report.findings
    .filter((finding) => !finding.bumps.some((entry) => entry.fix?.status === 'fix'))
    .map((finding) => ({
      advisory: finding.advisory,
      affects: finding.originPackages ?? [],
      module: finding.package,
      reason: noFixReason({ finding, scope }),
      severity: finding.severity,
      through: throughFor({ finding }),
    }))
}

/** Ids of bumps whose dependency still carries one of the bump's advisories in the re-audit. */
export function findUnclearedBumps({ bumps, report }) {
  return bumps
    .filter((bump) =>
      report.findings.some(
        (finding) =>
          bump.advisories.includes(finding.advisory) && isReportedThrough({ finding, bump }),
      ),
    )
    .map((bump) => bump.id)
}

/**
 * `fixed`: no longer reported. `partly`: still reported, but not through any dependency in `bumps`.
 */
export function classifyFixes({ bumps, report }) {
  const dependencies = new Set(bumps.map((bump) => bump.dependency))
  const findingsByAdvisory = new Map(report.findings.map((finding) => [finding.advisory, finding]))
  const fixed = new Set()
  const partly = new Set()

  for (const advisory of bumps.flatMap((bump) => bump.advisories)) {
    const finding = findingsByAdvisory.get(advisory)

    if (!finding) {
      fixed.add(advisory)
      continue
    }
    if (!finding.bumps.some((entry) => dependencies.has(entry.dependency))) {
      partly.add(advisory)
    }
  }

  return { fixed: [...fixed].sort(), partly: [...partly].sort() }
}

// Ids name branches, artifacts and store keys, so a slug collision would mix two dependencies.
function assertUniqueIds({ bumps }) {
  const dependencyById = new Map()

  for (const bump of bumps) {
    if (dependencyById.has(bump.id)) {
      throw new Error(
        `bump id ${bump.id} is shared by ${dependencyById.get(bump.id)} and ${bump.dependency}`,
      )
    }
    dependencyById.set(bump.id, bump.dependency)
  }
}

function isReportedThrough({ finding, bump }) {
  return finding.bumps.some((entry) => entry.dependency === bump.dependency)
}

function noFixReason({ finding, scope }) {
  if (finding.bumps.some((entry) => entry.fix?.status === 'relock')) {
    return scope === 'monorepo' ? MONOREPO_RELOCK_REASON : CONSUMER_RELOCK_REASON
  }

  const dependencies = [...new Set(finding.bumps.map((entry) => entry.dependency))]

  return `No ${dependencies.join(' or ')} release fixes it.`
}

function throughFor({ finding }) {
  const firstPath = finding.paths?.[0]
  if (!firstPath) {
    return [finding.package]
  }

  return firstPath.split('>').map((part) => part.trim())
}

function manifestsFor({ dependency, report }) {
  const manifests = report.plan.actions
    .filter((action) => action.type === 'bump' && action.dependency === dependency)
    .flatMap((action) => action.manifests ?? [])

  return [...new Set(manifests)].sort()
}

function branchFor({ ref, suffix }) {
  return `ci/audit-deps-fix-${ref}-${suffix}`
}

function bumpsForDependency({ dependency, entries, report }) {
  const slug = slugDependency({ dependency })
  const manifests = manifestsFor({ dependency, report })
  const lowestEntry = entries.reduce((lowest, entry) =>
    currentMajorOf({ entry }) < currentMajorOf({ entry: lowest }) ? entry : lowest,
  )
  const currentMajor = currentMajorOf({ entry: lowestEntry })
  const currentVersion = lowestVersionOf({ spec: lowestEntry.currentSpec })
  const target = highestVersion({ versions: entries.map((entry) => entry.version) })
  const isMajor = isBreakingChange({ currentMajor, currentVersion, version: target })
  const base = {
    dependency,
    from: lowestEntry.currentSpec,
    fromVersion: currentVersion,
    manifests,
  }
  const main = {
    ...base,
    id: `${slug}-${majorOf({ version: target })}`,
    advisories: sortedUnique({ values: entries.map((entry) => entry.advisory) }),
    fallbackFor: null,
    isMajor,
    to: target,
  }

  if (!isMajor) {
    return [main]
  }

  const withinCurrent = entries.filter(
    (entry) =>
      majorOf({ version: entry.version }) === currentMajor &&
      !isBreakingChange({ currentMajor, currentVersion, version: entry.version }),
  )
  if (withinCurrent.length === 0) {
    return [main]
  }

  const fallbackTarget = highestVersion({ versions: withinCurrent.map((entry) => entry.version) })
  const fallback = {
    ...base,
    id: `${slug}-${currentMajor}-fallback`,
    advisories: sortedUnique({
      values: entries
        .filter((entry) => compareVersions({ a: entry.version, b: fallbackTarget }) <= 0)
        .map((entry) => entry.advisory),
    }),
    fallbackFor: main.id,
    isMajor: false,
    to: fallbackTarget,
  }

  return [main, fallback]
}

// Under semver, `^0.x` treats a minor change as breaking. Without a readable current version
// (e.g. `catalog:`) only the major counts.
function isBreakingChange({ currentMajor, currentVersion, version }) {
  if (majorOf({ version }) > currentMajor) {
    return true
  }

  return (
    currentMajor === 0 &&
    currentVersion !== '' &&
    minorOf({ version }) > minorOf({ version: currentVersion })
  )
}

function currentMajorOf({ entry }) {
  const version = lowestVersionOf({ spec: entry.currentSpec })

  return version ? majorOf({ version }) : entry.fromMajor
}

function highestVersion({ versions }) {
  return versions.reduce((highest, version) =>
    compareVersions({ a: version, b: highest }) > 0 ? version : highest,
  )
}

function sortedUnique({ values }) {
  return [...new Set(values)].sort()
}

function lowestVersionOf({ spec }) {
  const version = spec.replace(/^[\^~=]+/, '')

  return /^\d+(\.\d+)*(-[\w.]+)?$/.test(version) ? version : ''
}

function majorOf({ version }) {
  return Number.parseInt(version.split('.')[0], 10)
}

function minorOf({ version }) {
  return Number.parseInt(version.split('.')[1] ?? '0', 10)
}
