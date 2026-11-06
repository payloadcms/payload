import {
  gte,
  major,
  maxSatisfying,
  minVersion,
  prerelease,
  satisfies,
  sort,
  valid,
  validRange,
} from 'semver'

type DependencyGroup = {
  dependency: string
  /** The single resolved spec shared by every owner in this group; null when undeclared. */
  spec: null | string
  workspacePackages: string[]
}

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
      const groups = groupByDependencyAndSpec({ directDeps, index })
      const bumps = await Promise.all(
        groups.map((group) =>
          buildBump({
            chainPackages: new Set(finding.chainPackages),
            client,
            group,
            module: finding.package,
            patchedRange: finding.fixed_in,
          }),
        ),
      )
      return { ...finding, bumps: bumps.sort(compareBumps) }
    }),
  )

/**
 * Groups owners by (dependency, declared spec) so each suggestion targets a single
 * spec. Owners that declare the same dependency at different ranges get separate
 * bumps — a version that only relocks one range must not be reported as relocking
 * a stricter range that still forbids it.
 */
const groupByDependencyAndSpec = ({
  directDeps,
  index,
}: {
  directDeps: Finding['directDeps']
  index: DeclaredIndex
}): DependencyGroup[] => {
  const groups = new Map<string, DependencyGroup>()
  for (const { dependency, workspacePackage } of directDeps) {
    const spec = workspacePackage ? (index.get(workspacePackage)?.get(dependency) ?? null) : null
    const key = `${dependency}\t${spec ?? ''}`
    const group = groups.get(key) ?? { dependency, spec, workspacePackages: [] }
    if (workspacePackage && !group.workspacePackages.includes(workspacePackage)) {
      group.workspacePackages.push(workspacePackage)
    }
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    group.workspacePackages.sort()
  }
  return [...groups.values()]
}

const compareBumps = (a: Bump, b: Bump): number =>
  a.dependency.localeCompare(b.dependency) ||
  (a.currentSpec ?? '').localeCompare(b.currentSpec ?? '')

const buildBump = async ({
  chainPackages,
  client,
  group,
  module,
  patchedRange,
}: {
  chainPackages: Set<string>
  client: RegistryClient
  group: DependencyGroup
  module: string
  patchedRange: string
}): Promise<Bump> => {
  const { dependency, spec, workspacePackages } = group
  if (!validRange(patchedRange)) {
    return {
      currentSpec: spec,
      dependency,
      fix: { reason: 'no-patched-range', status: 'unknown' },
      workspacePackages,
    }
  }
  // Aliases, dist-tags, and file/git specs carry no semver floor to bump from.
  if (spec && !validRange(spec)) {
    return {
      currentSpec: spec,
      dependency,
      fix: { reason: 'unsupported-spec', status: 'unknown' },
      workspacePackages,
    }
  }

  const min = spec ? minVersion(spec) : null
  const fix = await findMinimalFix({
    chainPackages,
    client,
    currentMajor: min ? major(min) : null,
    currentSpec: spec,
    dependency,
    floorVersion: min?.version ?? null,
    module,
    patchedRange,
  })
  return { currentSpec: spec, dependency, fix, workspacePackages }
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
 * Walks the dependency graph of `rootName@rootVersion`, resolving each dependency to its highest
 * satisfying version, and returns whether every reachable copy of the vulnerable module is in
 * the patched range.
 *
 * The first walk follows only the packages on the introducing chains (the dependency paths that
 * the audit found to the module), which limits registry requests for each candidate. If that
 * walk finds no copy, a chain package may have been renamed or replaced, so the whole graph is
 * walked before the result is `clear`. A `clear` from the first walk can miss a new copy off the
 * chain. The audit that runs again after the bump finds such a copy.
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
  // A patched root can still pull a vulnerable copy back in, so the trace continues below it.
  if (rootName === module && !satisfies(rootVersion, patchedRange)) {
    return 'vulnerable'
  }

  const root = { client, module, rootName, rootVersion }
  const onChain = await collectModuleVersions({
    ...root,
    shouldFollow: (name) => chainPackages.has(name),
  })
  const moduleVersions =
    Array.isArray(onChain) && onChain.length === 0
      ? await collectModuleVersions({ ...root, shouldFollow: () => true })
      : onChain
  if (moduleVersions === 'unknown') {
    return 'unknown'
  }

  return moduleVersions.every((version) => satisfies(version, patchedRange))
    ? 'clear'
    : 'vulnerable'
}

/** Lists the versions of `module` reachable through packages that `shouldFollow` accepts. */
const collectModuleVersions = async ({
  client,
  module,
  rootName,
  rootVersion,
  shouldFollow,
}: {
  client: RegistryClient
  module: string
  rootName: string
  rootVersion: string
  shouldFollow: (name: string) => boolean
}): Promise<'unknown' | string[]> => {
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
      if (!isModule && !shouldFollow(depName)) {
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

  return moduleVersions
}
