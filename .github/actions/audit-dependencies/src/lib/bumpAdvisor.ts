import { gte, major, maxSatisfying, minVersion, prerelease, satisfies, sort, valid } from 'semver'

import type { Bump, Finding, FixResult, ReportedFinding } from '../types'
import type { DeclaredIndex } from './packages'
import type { RegistryClient } from './registry'

/**
 * Enriches findings with per-direct-dependency bump suggestions. For each direct
 * dependency we declare, traces registry metadata to find the minimal version whose
 * resolution pulls the vulnerable module into its patched range — so we suggest the
 * smallest safe bump rather than jumping to latest.
 */
export const annotateFindings = async ({
  client,
  findings,
  index,
}: {
  client: RegistryClient
  findings: Finding[]
  index: DeclaredIndex
}): Promise<ReportedFinding[]> =>
  Promise.all(
    findings.map(async ({ directDeps, ...finding }) => {
      const grouped = groupByDependency(directDeps)
      const bumps = await Promise.all(
        [...grouped.entries()].map(([dependency, workspacePackages]) =>
          buildBump({
            chainPackages: new Set(finding.chainPackages),
            client,
            dependency,
            index,
            module: finding.package,
            patchedRange: finding.fixed_in,
            workspacePackages,
          }),
        ),
      )
      return { ...finding, bumps: bumps.sort((a, b) => a.dependency.localeCompare(b.dependency)) }
    }),
  )

const groupByDependency = (directDeps: Finding['directDeps']): Map<string, string[]> => {
  const grouped = new Map<string, string[]>()
  for (const { dependency, workspacePackage } of directDeps) {
    const owners = grouped.get(dependency) ?? []
    if (workspacePackage && !owners.includes(workspacePackage)) {
      owners.push(workspacePackage)
    }
    grouped.set(dependency, owners.sort())
  }
  return grouped
}

const buildBump = async ({
  chainPackages,
  client,
  dependency,
  index,
  module,
  patchedRange,
  workspacePackages,
}: {
  chainPackages: Set<string>
  client: RegistryClient
  dependency: string
  index: DeclaredIndex
  module: string
  patchedRange: string
  workspacePackages: string[]
}): Promise<Bump> => {
  const declared = declaredSpecs({ dependency, index, workspacePackages })
  const fix = await findMinimalFix({
    chainPackages,
    client,
    currentMajor: declared.currentMajor,
    currentSpec: declared.currentSpec,
    dependency,
    floorVersion: declared.floorVersion,
    module,
    patchedRange,
  })
  return { currentSpec: declared.currentSpec, dependency, fix, workspacePackages }
}

/** Reads what version(s) of the dependency the owning packages declare (catalog-resolved). */
const declaredSpecs = ({
  dependency,
  index,
  workspacePackages,
}: {
  dependency: string
  index: DeclaredIndex
  workspacePackages: string[]
}): { currentMajor: null | number; currentSpec: null | string; floorVersion: null | string } => {
  const specs = new Set<string>()
  const mins: string[] = []
  for (const owner of workspacePackages) {
    const spec = index.get(owner)?.get(dependency)
    if (!spec) {
      continue
    }
    specs.add(spec)
    const min = minVersion(spec)
    if (min) {
      mins.push(min.version)
    }
  }

  const sortedMins = sort(mins)
  const floorVersion = sortedMins[0] ?? null
  // Highest current major across owners: a fix at that major does not "cross" for anyone already there.
  const currentMajor = mins.length > 0 ? Math.max(...mins.map((min) => major(min))) : null
  const currentSpec = specs.size === 1 ? [...specs][0] : null
  return { currentMajor, currentSpec, floorVersion }
}

const findMinimalFix = async ({
  chainPackages,
  client,
  currentMajor,
  currentSpec,
  dependency,
  floorVersion,
  module,
  patchedRange,
}: {
  chainPackages: Set<string>
  client: RegistryClient
  currentMajor: null | number
  currentSpec: null | string
  dependency: string
  floorVersion: null | string
  module: string
  patchedRange: string
}): Promise<FixResult> => {
  if (floorVersion === null) {
    // Without a known current version, scanning from zero would surface an ancient
    // pre-vulnerability release and suggest a downgrade — refuse rather than mislead.
    return { reason: 'no-current-version', status: 'unknown' }
  }

  const packument = await client.fetchPackument(dependency)
  if (!packument) {
    return { reason: 'registry', status: 'unknown' }
  }

  const candidates = sort(
    Object.keys(packument.versions).filter(
      (version) =>
        valid(version) !== null && prerelease(version) === null && gte(version, floorVersion),
    ),
  )

  for (const version of candidates) {
    const outcome = await traceModule({
      chainPackages,
      client,
      module,
      patchedRange,
      rootName: dependency,
      rootVersion: version,
    })
    if (outcome === 'unknown') {
      // A missing packument makes every candidate indeterminate; do not guess.
      return { reason: 'registry', status: 'unknown' }
    }
    if (outcome === 'clear') {
      // The declared range already permits this version — only the lockfile is stale.
      if (currentSpec !== null && satisfies(version, currentSpec)) {
        return { status: 'relock', version }
      }
      const toMajor = major(version)
      return {
        crossesMajor: currentMajor !== null && toMajor > currentMajor,
        fromMajor: currentMajor,
        status: 'fix',
        toMajor,
        version,
      }
    }
  }

  return { status: 'none' }
}

type TraceOutcome = 'clear' | 'unknown' | 'vulnerable'

/**
 * Walks the dependency graph of `rootName@rootVersion`, restricted to the packages
 * that appeared on the introducing chains, resolving each hop to its highest
 * satisfying version. Returns whether every reachable version of the vulnerable
 * module lands in the patched range.
 */
const traceModule = async ({
  chainPackages,
  client,
  module,
  patchedRange,
  rootName,
  rootVersion,
}: {
  chainPackages: Set<string>
  client: RegistryClient
  module: string
  patchedRange: string
  rootName: string
  rootVersion: string
}): Promise<TraceOutcome> => {
  const moduleVersions: string[] = []
  const visited = new Set<string>([`${rootName}@${rootVersion}`])
  const queue: Array<{ name: string; version: string }> = [{ name: rootName, version: rootVersion }]

  while (queue.length > 0) {
    const node = queue.pop()
    if (!node) {
      break
    }

    const packument = await client.fetchPackument(node.name)
    if (!packument) {
      return 'unknown'
    }
    const dependencies = packument.versions[node.version]?.dependencies
    if (!dependencies) {
      continue
    }

    for (const [depName, range] of Object.entries(dependencies)) {
      const isModule = depName === module
      if (!isModule && !chainPackages.has(depName)) {
        continue
      }

      const depPackument = await client.fetchPackument(depName)
      if (!depPackument) {
        return 'unknown'
      }
      const resolved = maxSatisfying(Object.keys(depPackument.versions), range)
      if (resolved === null) {
        continue
      }
      if (isModule) {
        moduleVersions.push(resolved)
        continue
      }
      const key = `${depName}@${resolved}`
      if (!visited.has(key)) {
        visited.add(key)
        queue.push({ name: depName, version: resolved })
      }
    }
  }

  if (moduleVersions.length === 0) {
    // The bumped dependency no longer pulls the module through the known chain.
    return 'clear'
  }
  return moduleVersions.every((version) => satisfies(version, patchedRange))
    ? 'clear'
    : 'vulnerable'
}
