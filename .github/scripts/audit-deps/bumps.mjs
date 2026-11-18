/**
 * @typedef {object} Bump
 * @property {string} id `<slug>-<target major>`, or `<slug>-<current major>-in-major` for an
 *   in-major bump
 * @property {string} dependency
 * @property {string} from specifier from the audit report, for example '^9.5.0'. The audit
 *   resolves `catalog:` specifiers to their catalog entry.
 * @property {string} fromVersion lowest version that `from` allows; '' when `from` holds no version
 * @property {string} to target version
 * @property {boolean} isMajor
 * @property {string[]} manifests repo-relative package.json paths
 * @property {string[]} advisories sorted GHSA IDs that this bump targets
 *
 * @typedef {object} PlannedPr
 * @property {string} id
 * @property {'group' | 'major'} kind
 * @property {string} branch
 * @property {string[]} bumpIds
 *
 * @typedef {object} NoFix
 * @property {string} advisory
 * @property {string} severity
 * @property {string} module
 * @property {string} reason
 */

const CONSUMER_RELOCK_REASON = 'Needs an override or relock; consumers do not get our overrides.'
const MONOREPO_RELOCK_REASON = 'Not handled: needs a relock or override.'
const STRICT_SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/

/** Compares major, minor and patch; prerelease tags are ignored. Negative when `a` is lower. */
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
 * Builds one bump per dependency, aimed at the highest fix version across its findings. Only
 * report entries with the status `fix` produce bumps.
 * When that bump crosses a major version, a second bump inside the current major (an in-major
 * bump) is added for the advisories that it fixes completely. The in-major bump goes into the
 * non-major group PR, so it can merge without the major. Throws when two dependencies produce
 * the same bump ID.
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
      // The version comes from the registry and goes into package.json and the PR title, so
      // anything other than strict semver is rejected.
      if (!STRICT_SEMVER_PATTERN.test(entry.fix.version)) {
        throw new Error(
          `invalid fix version for ${entry.dependency}: ${JSON.stringify(entry.fix.version)}`,
        )
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
 * Plans one group PR for all non-major bumps, then one PR for each major bump, sorted by
 * dependency name.
 *
 * @returns {PlannedPr[]}
 */
export function buildPrs({ bumps, ref }) {
  const groupBumpIds = bumps.filter((bump) => !bump.isMajor).map((bump) => bump.id)
  const prs = []

  if (groupBumpIds.length > 0) {
    prs.push({
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
    prs.push({
      id: bump.id,
      kind: 'major',
      branch: branchFor({ ref, suffix: bump.id }),
      bumpIds: [bump.id],
    })
  }

  return prs
}

/**
 * Lists the findings that have no `fix` entry, so no bump can resolve them.
 *
 * @returns {NoFix[]}
 */
export function listNoFix({ report, scope }) {
  return report.findings
    .filter((finding) => !finding.bumps.some((entry) => entry.fix?.status === 'fix'))
    .map((finding) => ({
      advisory: finding.advisory,
      module: finding.package,
      reason: noFixReason({ finding, scope }),
      severity: finding.severity,
    }))
}

/**
 * Sorts the advisories of `bumps` by their state in `report`, the audit taken after the bumps.
 * `fixed` advisories are absent from the report. `partly` advisories are in the report, but only
 * through dependencies that `bumps` does not change. An advisory in neither list is reported
 * through a bumped dependency.
 */
export function classifyFixes({ bumps, report }) {
  const dependencies = new Set(bumps.map((bump) => bump.dependency))
  const fixed = new Set()
  const partly = new Set()

  for (const advisory of bumps.flatMap((bump) => bump.advisories)) {
    // The monorepo audit does not merge by GHSA, so one GHSA can have one finding per module.
    const findings = report.findings.filter((finding) => finding.advisory === advisory)

    if (findings.length === 0) {
      fixed.add(advisory)
      continue
    }
    const isReachedThroughBump = findings.some((finding) =>
      finding.bumps.some((entry) => dependencies.has(entry.dependency)),
    )
    if (!isReachedThroughBump) {
      partly.add(advisory)
    }
  }

  return { fixed: [...fixed].sort(), partly: [...partly].sort() }
}

// Bump IDs are part of PR branch names, so two dependencies with one ID would share a branch.
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

function noFixReason({ finding, scope }) {
  if (finding.bumps.some((entry) => entry.fix?.status === 'relock')) {
    return scope === 'monorepo' ? MONOREPO_RELOCK_REASON : CONSUMER_RELOCK_REASON
  }

  const dependencies = [...new Set(finding.bumps.map((entry) => entry.dependency))]

  return `No ${dependencies.join(' or ')} release fixes it.`
}

function manifestsFor({ dependency, report }) {
  const manifests = report.plan.actions
    .filter((action) => action.type === 'bump' && action.dependency === dependency)
    .flatMap((action) => action.manifests ?? [])

  return [...new Set(manifests)].sort()
}

function slugDependency({ dependency }) {
  return dependency
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
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

  const inMajorTarget = highestVersion({ versions: withinCurrent.map((entry) => entry.version) })
  const inMajorAdvisories = main.advisories.filter((advisory) =>
    entries
      .filter((entry) => entry.advisory === advisory)
      .every((entry) => compareVersions({ a: entry.version, b: inMajorTarget }) <= 0),
  )
  if (inMajorAdvisories.length === 0) {
    return [main]
  }

  // Return both bumps: some advisory needs a version above the in-major target, which only the
  // major bump reaches.
  return [
    main,
    {
      ...base,
      id: `${slug}-${currentMajor}-in-major`,
      advisories: inMajorAdvisories,
      isMajor: false,
      to: inMajorTarget,
    },
  ]
}

// Semver treats a minor change in 0.x as breaking. When the current version is unknown, as with
// `>=0.2.0`, only a change of major counts.
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
