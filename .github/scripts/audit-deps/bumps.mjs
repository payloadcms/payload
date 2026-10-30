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

const RELOCK_REASON = 'Needs an override or relock; consumers do not get our overrides.'

export function slugDependency({ dependency }) {
  return dependency
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

/**
 * One bump per dependency and target major, aimed at the highest version any finding needs.
 * Only `fix` entries produce bumps; `scope` is already applied by the audit that wrote the report.
 *
 * @returns {Bump[]}
 */
export function buildBumps({ report }) {
  const groups = new Map()

  for (const finding of report.findings) {
    for (const entry of finding.bumps) {
      if (entry.fix?.status !== 'fix') {
        continue
      }

      const toMajor = majorOf({ version: entry.fix.version })
      const isMajor = entry.fix.crossesMajor === true
      const key = `${entry.dependency}\0${isMajor}\0${toMajor}`
      const group = groups.get(key) ?? {
        advisories: new Set(),
        dependency: entry.dependency,
        from: entry.currentSpec,
        isMajor,
        to: entry.fix.version,
        toMajor,
      }

      group.advisories.add(finding.advisory)
      if (compareVersions({ a: entry.fix.version, b: group.to }) > 0) {
        group.to = entry.fix.version
      }
      groups.set(key, group)
    }
  }

  const majorByDependency = new Map()
  for (const group of groups.values()) {
    if (!group.isMajor) {
      continue
    }
    const current = majorByDependency.get(group.dependency)
    if (current === undefined || group.toMajor > current) {
      majorByDependency.set(group.dependency, group.toMajor)
    }
  }

  const bumps = [...groups.values()].map((group) => {
    const slug = slugDependency({ dependency: group.dependency })
    const fallbackMajor = group.isMajor ? undefined : majorByDependency.get(group.dependency)
    const hasMajorSibling = fallbackMajor !== undefined

    return {
      id: hasMajorSibling ? `${slug}-${group.toMajor}-fallback` : `${slug}-${group.toMajor}`,
      advisories: [...group.advisories].sort(),
      dependency: group.dependency,
      fallbackFor: hasMajorSibling ? `${slug}-${fallbackMajor}` : null,
      from: group.from,
      fromVersion: lowestVersionOf({ spec: group.from }),
      isMajor: group.isMajor,
      manifests: manifestsFor({ dependency: group.dependency, report }),
      to: group.to,
    }
  })

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
export function listNoFix({ report }) {
  return report.findings
    .filter((finding) => !finding.bumps.some((entry) => entry.fix?.status === 'fix'))
    .map((finding) => ({
      advisory: finding.advisory,
      affects: finding.originPackages ?? [],
      module: finding.package,
      reason: noFixReason({ finding }),
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

function isReportedThrough({ finding, bump }) {
  return finding.bumps.some((entry) => entry.dependency === bump.dependency)
}

function noFixReason({ finding }) {
  if (finding.bumps.some((entry) => entry.fix?.status === 'relock')) {
    return RELOCK_REASON
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

function lowestVersionOf({ spec }) {
  const version = spec.replace(/^[\^~=]+/, '')

  return /^\d/.test(version) ? version : ''
}

function majorOf({ version }) {
  return Number.parseInt(version.split('.')[0], 10)
}

function compareVersions({ a, b }) {
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
