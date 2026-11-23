import { execFile, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import semver from 'semver'

import type { ResolvedVersions } from './toolchain.js'

export type RegistryVersion = {
  dependencies?: Record<string, string>
  engines?: Record<string, string>
  peerDependencies?: Record<string, string>
  version?: string
}

export type RegistryPackage = {
  'dist-tags'?: Record<string, string>
  getVersion?: (args: { version: string }) => Promise<RegistryVersion | undefined>
  versions?: Record<string, RegistryVersion>
}

export type FetchRegistry = (name: string) => Promise<RegistryPackage>

type Dependency = {
  currentVersion?: string
  group: 'dependencies' | 'devDependencies'
  name: string
  spec: string
}

export type ProjectInfo = {
  currentVersion: string
  data: Record<string, unknown>
  dependencies: Dependency[]
  originalText: string
  packageJsonPath: string
  projectDir: string
}

export type UpgradePlan = {
  blockers: string[]
  changes: { from: string; group: Dependency['group']; name: string; to: string }[]
  kind: 'migrate' | 'update'
  notices: string[]
  overridesRemoved: string[]
  project: ProjectInfo
  targetVersion: string
  toolchain?: ResolvedVersions
}

const dependencyGroups = ['dependencies', 'devDependencies'] as const

/** Prefer the installed version: ranges and dist-tags describe intent, not resolution. */
export function readProject({ projectDir }: { projectDir: string }): ProjectInfo {
  const directory = resolve(projectDir)
  const packageJsonPath = join(directory, 'package.json')
  let originalText: string
  try {
    originalText = readFileSync(packageJsonPath, 'utf8')
  } catch {
    throw new Error(`No package.json found in ${directory}. Run this command in a Payload project.`)
  }
  const data = JSON.parse(originalText) as Record<string, unknown>
  const dependencies: Dependency[] = []
  for (const group of dependencyGroups) {
    for (const [name, spec] of Object.entries(asRecord(data[group]))) {
      if (typeof spec === 'string') {
        dependencies.push({
          currentVersion: readInstalledVersion({ name, projectDir: directory }),
          group,
          name,
          spec,
        })
      }
    }
  }
  const payload = dependencies.find(({ name }) => name === 'payload')
  if (!payload) {
    throw new Error(`No direct payload dependency found in ${packageJsonPath}.`)
  }
  if (
    !payload.currentVersion &&
    ancestorDirectories({ projectDir: directory }).some((path) =>
      existsSync(join(path, '.pnp.cjs')),
    )
  ) {
    throw new Error(
      'Could not resolve Payload through Yarn Plug’n’Play. Run yarn install first, or use the node-modules linker before upgrading.',
    )
  }
  const currentVersion = payload.currentVersion ?? versionFromRange({ spec: payload.spec })
  if (!currentVersion) {
    throw new Error(
      `Cannot determine the current Payload release from "${payload.spec}". Install the project's dependencies first.`,
    )
  }
  return {
    currentVersion,
    data,
    dependencies,
    originalText,
    packageJsonPath,
    projectDir: directory,
  }
}

/** Offer a same-major update separately from the CLI's latest supported release line. */
export async function resolveTargets({
  defaultTag,
  explicitTarget,
  fetchRegistry,
  project,
}: {
  defaultTag: string
  explicitTarget?: string
  fetchRegistry: FetchRegistry
  project: ProjectInfo
}): Promise<{ label: string; version: string }[]> {
  const doc = await fetchRegistry('payload')
  const versions = Object.keys(doc.versions ?? {}).filter((version) => semver.valid(version))
  if (explicitTarget) {
    const version = semver.valid(explicitTarget) ?? doc['dist-tags']?.[explicitTarget]
    if (!version || !versions.includes(version)) {
      throw new Error(`No published Payload release matches "${explicitTarget}".`)
    }
    return [{ label: releaseLabel({ version }), version }]
  }
  const currentMajor = semver.major(project.currentVersion)
  const currentPrerelease = semver.prerelease(project.currentVersion)?.[0]
  const sameMajor = versions
    .filter((version) => {
      const prerelease = semver.prerelease(version)
      return (
        semver.major(version) === currentMajor &&
        (!prerelease || (currentPrerelease !== undefined && prerelease[0] === currentPrerelease))
      )
    })
    .sort(semver.rcompare)[0]
  const latest = doc['dist-tags']?.[defaultTag]
  const targets: { label: string; version: string }[] = []
  if (sameMajor && semver.gte(sameMajor, project.currentVersion)) {
    targets.push({
      label: `Update to the latest v${currentMajor} release: ${releaseLabel({ version: sameMajor })}`,
      version: sameMajor,
    })
  }
  if (
    latest &&
    semver.valid(latest) &&
    semver.gte(latest, project.currentVersion) &&
    (!sameMajor || semver.gt(latest, sameMajor))
  ) {
    targets.push({
      label: `Upgrade to Payload v${semver.major(latest)}: ${releaseLabel({ version: latest })}`,
      version: latest,
    })
  }
  if (targets.length === 0) {
    throw new Error(
      `No update is available for Payload ${project.currentVersion} on the "${defaultTag}" release channel.`,
    )
  }
  return targets
}

/** Resolve each independent package from published compatibility, never its own major. */
export async function createUpgradePlan({
  corePackageNames,
  fetchRegistry,
  project,
  targetVersion,
}: {
  corePackageNames: readonly string[]
  fetchRegistry: FetchRegistry
  project: ProjectInfo
  targetVersion: string
}): Promise<UpgradePlan> {
  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid Payload target version: ${targetVersion}.`)
  }
  const currentMajor = semver.major(project.currentVersion)
  const targetMajor = semver.major(targetVersion)
  const plan: UpgradePlan = {
    blockers: [],
    changes: [],
    kind: currentMajor === targetMajor ? 'update' : 'migrate',
    notices: [],
    overridesRemoved: [],
    project,
    targetVersion,
  }
  if (semver.lt(targetVersion, project.currentVersion)) {
    plan.blockers.push(
      `Downgrading Payload ${project.currentVersion} to ${targetVersion} is not supported.`,
    )
  }
  if (plan.kind === 'migrate' && !(currentMajor === 3 && targetMajor === 4)) {
    plan.blockers.push(
      `Automatic migration from Payload v${currentMajor} to v${targetMajor} is not supported.`,
    )
  }
  const core = new Set(['payload', ...corePackageNames])
  const selected = new Map<string, { manifest: RegistryVersion; version: string }>()
  const independent: Dependency[] = []
  for (const dependency of project.dependencies) {
    const { name, spec } = dependency
    if (!core.has(name) && !name.startsWith('@payloadcms/')) {
      continue
    }
    if (!isRegistrySpec({ spec })) {
      plan.blockers.push(
        `${name} uses "${spec}". Resolve its workspace, alias, or local reference before upgrading.`,
      )
      continue
    }
    if (core.has(name)) {
      const installed = dependency.currentVersion
      const declared = versionFromRange({ spec })
      if (installed && semver.major(installed) !== currentMajor) {
        plan.blockers.push(
          `${name}@${installed} and payload@${project.currentVersion} are on different major versions. Align the project first.`,
        )
      }
      if (declared && semver.major(declared) !== currentMajor) {
        plan.blockers.push(
          `${name} declares ${spec}, but the detected project is on Payload ${project.currentVersion}. Align installed and declared versions first.`,
        )
      }
      const manifest = await readRegistryVersion({
        doc: await fetchRegistry(name),
        version: targetVersion,
      })
      if (!manifest) {
        plan.blockers.push(`${name}@${targetVersion} is not published. No files have been changed.`)
        continue
      }
      selected.set(name, { manifest, version: targetVersion })
      addChange({ dependency, plan, version: targetVersion })
    } else if (name.startsWith('@payloadcms/eslint')) {
      plan.notices.push(
        `${name}: keeping ${spec}; this tooling package is versioned independently.`,
      )
    } else {
      independent.push(dependency)
    }
  }
  const unresolved: { dependency: Dependency; doc: RegistryPackage }[] = []
  const compatible: { dependency: Dependency; doc: RegistryPackage }[] = []
  for (const dependency of independent.sort((a, b) => a.name.localeCompare(b.name))) {
    const doc = await fetchRegistry(dependency.name)
    const match = await compatibleRelease({
      constraints: independentConstraints({ dependency, project }),
      core,
      dependency,
      doc,
      selected,
      targetVersion,
      requireCorePeer: true,
      canDowngrade: plan.kind === 'migrate',
    })
    if (match) {
      compatible.push({ dependency, doc })
    } else {
      unresolved.push({ dependency, doc })
    }
  }
  await selectIndependentReleases({
    core,
    entries: [
      ...compatible.map((entry) => ({ ...entry, requiresCorePeer: true })),
      ...unresolved.map((entry) => ({ ...entry, requiresCorePeer: false })),
    ],
    plan,
    selected,
  })
  for (const { dependency } of compatible) {
    const match = selected.get(dependency.name)
    if (match) {
      addChange({ dependency, plan, version: match.version })
    }
  }
  // Companion packages can be selected only when a resolved plugin declares a relationship.
  for (const { dependency, doc } of unresolved) {
    const constraints = independentConstraints({ dependency, project })
    const match = selected.get(dependency.name)
    if (match) {
      addChange({ dependency, plan, version: match.version })
    } else {
      const message = `${dependency.name}: no release has published compatibility with Payload ${targetVersion}${constraints.length ? ' within the preserved override constraints' : ''}; keeping ${dependency.spec}. Check this package's upgrade instructions${constraints.length ? ' and overrides' : ''}.`
      if (plan.kind === 'migrate' || (await hasPublishedRelationship({ names: core, doc }))) {
        plan.blockers.push(message)
      } else {
        plan.notices.push(message)
      }
    }
  }
  checkSelectedRelationships({ core, plan, selected })
  inspectOverrides({ core, plan })
  return plan
}

/** Apply only the reviewed plan; retain unrelated dependencies and intentional overrides. */
export function applyUpgradePlan({ plan }: { plan: UpgradePlan }): Record<string, unknown> {
  if (plan.blockers.length > 0) {
    throw new Error(`Cannot apply upgrade:\n${plan.blockers.join('\n')}`)
  }
  const next = structuredClone(plan.project.data)
  for (const { group, name, to } of plan.changes) {
    const dependencies = asRecord(next[group])
    dependencies[name] = to
    next[group] = dependencies
  }
  const core = new Set(plan.overridesRemoved)
  for (const { block, label, owner, property } of overrideBlocks({ data: next }).reverse()) {
    for (const key of Object.keys(block)) {
      if (core.has(`${label}.${key}`)) {
        delete block[key]
      }
    }
    if (Object.keys(block).length === 0) {
      delete owner[property]
    }
  }
  if (Object.keys(asRecord(next.pnpm)).length === 0) {
    delete next.pnpm
  }
  return next
}

export function formatUpgradePlan({ plan }: { plan: UpgradePlan }): string {
  return [
    `Payload ${plan.project.currentVersion} → ${releaseLabel({ version: plan.targetVersion })}`,
    ...plan.changes.map(
      ({ from, group, name, to }) =>
        `  ${name}: ${from} → ${to}${group === 'devDependencies' ? ' (dev)' : ''}`,
    ),
    ...plan.overridesRemoved.map((name) => `  Remove conflicting core override: ${name}`),
    ...plan.notices.map((message) => `  Note: ${message}`),
    ...plan.blockers.map((message) => `  Blocked: ${message}`),
    ...(plan.changes.length === 0 && plan.blockers.length === 0
      ? ['  Package versions are already up to date.']
      : []),
  ].join('\n')
}

/** npm reads the project's registry/auth configuration, including scoped registries. */
export function createRegistryClient({ projectDir }: { projectDir: string }): FetchRegistry {
  const packages = new Map<string, Promise<RegistryPackage>>()
  return (name) => {
    if (!packages.has(name)) {
      packages.set(
        name,
        (async () => {
          const tags = asRecord(await npmMetadata({ command: 'dist-tags', name, projectDir }))
          const taggedVersion = Object.values(tags).find(
            (value): value is string => typeof value === 'string' && Boolean(semver.valid(value)),
          )
          if (!taggedVersion) {
            throw new Error(`${name} has no published release tags.`)
          }
          const published = await npmMetadata({
            fields: ['versions'],
            name,
            projectDir,
            version: taggedVersion,
          })
          const versions = Array.isArray(published)
            ? published
            : typeof published === 'string'
              ? [published]
              : []
          const manifests = new Map<string, Promise<RegistryVersion | undefined>>()
          let stableManifests: Promise<Map<string, RegistryVersion>> | undefined
          const doc: RegistryPackage = {
            'dist-tags': tags as Record<string, string>,
            versions: Object.fromEntries(
              versions
                .filter((version): version is string => typeof version === 'string')
                .map((version) => [version, {}]),
            ),
            getVersion: ({ version }) => {
              if (!doc.versions?.[version]) {
                return Promise.resolve(undefined)
              }
              if (!manifests.has(version)) {
                if (semver.prerelease(version)) {
                  manifests.set(
                    version,
                    npmMetadata({
                      fields: ['name', 'version', 'peerDependencies', 'dependencies', 'engines'],
                      name,
                      projectDir,
                      version,
                    }).then((value) => asRecord(value) as RegistryVersion),
                  )
                } else {
                  // npm fetches a complete packument for each view. Read all stable manifests
                  // once rather than launching npm for every historical plugin release.
                  stableManifests ??= npmMetadata({
                    fields: ['name', 'version', 'peerDependencies', 'dependencies', 'engines'],
                    name,
                    projectDir,
                    version: 'x',
                  }).then((value) => {
                    const entries = (Array.isArray(value) ? value : [value]) as RegistryVersion[]
                    return new Map(
                      entries
                        .filter((entry) => typeof entry.version === 'string')
                        .map((entry) => [entry.version!, entry]),
                    )
                  })
                  manifests.set(
                    version,
                    stableManifests.then((entries) => entries.get(version)),
                  )
                }
              }
              return manifests.get(version)!
            },
          }
          return doc
        })(),
      )
    }
    return packages.get(name)!
  }
}

export async function readRegistryVersion({
  doc,
  version,
}: {
  doc: RegistryPackage
  version: string
}): Promise<RegistryVersion | undefined> {
  return doc.getVersion ? doc.getVersion({ version }) : doc.versions?.[version]
}

export function readInstalledVersion({
  name,
  projectDir,
}: {
  name: string
  projectDir: string
}): string | undefined {
  for (const path of ancestorDirectories({ projectDir })) {
    try {
      const value = JSON.parse(
        readFileSync(join(path, 'node_modules', name, 'package.json'), 'utf8'),
      ) as { version?: string }
      if (value.version && semver.valid(value.version)) {
        return value.version
      }
    } catch {
      // npm and Yarn may hoist a workspace's dependencies to an ancestor.
    }
    const loader = join(path, '.pnp.cjs')
    if (existsSync(loader)) {
      const script = `
        const fs = require('node:fs');
        const path = require('node:path');
        const requireProject = require('node:module').createRequire(path.join(process.argv[1], 'package.json'));
        const name = process.argv[2];
        let entry;
        try { entry = requireProject.resolve(name + '/package.json'); }
        catch { entry = requireProject.resolve(name); }
        let directory = path.dirname(entry);
        while (true) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
            if (pkg.name === name) { process.stdout.write(pkg.version); break; }
          } catch {}
          const parent = path.dirname(directory);
          if (parent === directory) break;
          directory = parent;
        }
      `
      const result = spawnSync(
        process.execPath,
        ['--require', loader, '-e', script, resolve(projectDir), name],
        { encoding: 'utf8' },
      )
      const version = result.stdout?.trim()
      return result.status === 0 && semver.valid(version) ? version : undefined
    }
  }
  return undefined
}

function ancestorDirectories({ projectDir }: { projectDir: string }): string[] {
  const paths: string[] = []
  let path = resolve(projectDir)
  while (true) {
    paths.push(path)
    const parent = dirname(path)
    if (parent === path) {
      return paths
    }
    path = parent
  }
}

function versionFromRange({ spec }: { spec: string }): string | undefined {
  if (!semver.validRange(spec)) {
    return undefined
  }
  const minimum = semver.minVersion(spec)
  if (
    !minimum ||
    !semver.subset(spec, `>=${minimum.major}.0.0-0 <${minimum.major + 1}.0.0-0`, {
      includePrerelease: true,
    })
  ) {
    return undefined
  }
  return minimum.version
}

function releaseLabel({ version }: { version: string }): string {
  return `${version}${semver.prerelease(version) ? ' (prerelease)' : ''}`
}

function isRegistrySpec({ spec }: { spec: string }): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|[./]|git@)/i.test(spec) && !spec.includes('/')
}

function addChange({
  dependency,
  plan,
  version,
}: {
  dependency: Dependency
  plan: UpgradePlan
  version: string
}): void {
  if (
    dependency.spec !== version ||
    (dependency.currentVersion && dependency.currentVersion !== version)
  ) {
    plan.changes.push({
      from: dependency.spec,
      group: dependency.group,
      name: dependency.name,
      to: version,
    })
  }
  if (dependency.currentVersion && semver.lt(version, dependency.currentVersion)) {
    plan.notices.push(
      `${dependency.name}: its compatible Payload release is ${version}, below installed package version ${dependency.currentVersion}.`,
    )
  }
}

async function compatibleRelease({
  canDowngrade,
  constraints,
  core,
  dependency,
  doc,
  excludedVersions,
  requireCorePeer,
  selected,
  targetVersion,
}: {
  canDowngrade: boolean
  constraints: string[]
  core: Set<string>
  dependency: Dependency
  doc: RegistryPackage
  excludedVersions?: Set<string>
  requireCorePeer: boolean
  selected: Map<string, { manifest: RegistryVersion; version: string }>
  targetVersion: string
}): Promise<{ manifest: RegistryVersion; version: string } | undefined> {
  const current =
    dependency.currentVersion ??
    (semver.validRange(dependency.spec) ? semver.minVersion(dependency.spec)?.version : undefined)
  const prereleaseChannels = [
    semver.prerelease(targetVersion)?.[0],
    ...(current ? [semver.prerelease(current)?.[0]] : []),
  ].filter((channel) => channel !== undefined)
  const versions = Object.keys(doc.versions ?? {})
    .filter((version) => {
      const prerelease = semver.prerelease(version)
      return (
        semver.valid(version) &&
        !excludedVersions?.has(version) &&
        constraints.every(
          (range) => semver.validRange(range) && semver.satisfies(version, range),
        ) &&
        (!prerelease ||
          (prerelease[0] !== undefined && prereleaseChannels.includes(prerelease[0]))) &&
        (canDowngrade || !current || semver.gte(version, current))
      )
    })
    .sort(semver.rcompare)
  for (const version of versions) {
    const manifest = await readRegistryVersion({ doc, version })
    if (!manifest) {
      continue
    }
    const relationships = { ...manifest.dependencies, ...manifest.peerDependencies }
    const coreRelations = Object.entries(relationships).filter(([name]) => core.has(name))
    if (coreRelations.some(([, range]) => !semver.satisfies(targetVersion, range))) {
      continue
    }
    if (requireCorePeer && coreRelations.length === 0) {
      continue
    }
    const companionRanges = [...selected.values()].flatMap(({ manifest: other }) => {
      const range =
        other.dependencies?.[dependency.name] ?? other.peerDependencies?.[dependency.name]
      return range ? [range] : []
    })
    const selectedRelations = Object.entries(relationships).filter(
      ([name]) => selected.has(name) && !core.has(name),
    )
    if (
      companionRanges.some((range) => !semver.satisfies(version, range)) ||
      selectedRelations.some(
        ([name, range]) => !semver.satisfies(selected.get(name)!.version, range),
      )
    ) {
      continue
    }
    if (
      !requireCorePeer &&
      coreRelations.length === 0 &&
      companionRanges.length === 0 &&
      selectedRelations.length === 0
    ) {
      continue
    }
    return { manifest, version }
  }
  return undefined
}

/** Backtrack only direct Payload-owned dependencies; never solve the project's whole tree. */
async function selectIndependentReleases({
  core,
  entries,
  plan,
  selected,
}: {
  core: Set<string>
  entries: { dependency: Dependency; doc: RegistryPackage; requiresCorePeer: boolean }[]
  plan: UpgradePlan
  selected: Map<string, { manifest: RegistryVersion; version: string }>
}): Promise<boolean> {
  let attemptsRemaining = 256
  async function select({ index }: { index: number }): Promise<boolean> {
    if (index === entries.length) {
      return true
    }
    const { dependency, doc, requiresCorePeer } = entries[index]!
    const excludedVersions = new Set<string>()
    while (attemptsRemaining-- > 0) {
      const match = await compatibleRelease({
        canDowngrade: plan.kind === 'migrate',
        constraints: independentConstraints({ dependency, project: plan.project }),
        core,
        dependency,
        doc,
        excludedVersions,
        requireCorePeer: requiresCorePeer,
        selected,
        targetVersion: plan.targetVersion,
      })
      if (!match) {
        const isRequiredBySelected = [...selected.values()].some(
          ({ manifest }) =>
            dependency.name in { ...manifest.dependencies, ...manifest.peerDependencies },
        )
        const hasKnownRelationship =
          requiresCorePeer ||
          isRequiredBySelected ||
          (await hasPublishedRelationship({ names: new Set([...core, ...selected.keys()]), doc }))
        if (!hasKnownRelationship) {
          return select({ index: index + 1 })
        }
        return false
      }
      selected.set(dependency.name, match)
      if (await select({ index: index + 1 })) {
        return true
      }
      selected.delete(dependency.name)
      excludedVersions.add(match.version)
    }
    return false
  }
  const isCompatible = await select({ index: 0 })
  if (!isCompatible) {
    plan.blockers.push(
      attemptsRemaining <= 0
        ? 'Compatibility checks reached the 256-candidate limit. Narrow independent package overrides or align their releases before upgrading.'
        : 'No mutually compatible set of independent Payload package releases was found. Review their peer dependencies and preserved overrides before upgrading.',
    )
  }
  return isCompatible
}

async function hasPublishedRelationship({
  names,
  doc,
}: {
  names: Set<string>
  doc: RegistryPackage
}): Promise<boolean> {
  for (const version of Object.keys(doc.versions ?? {})
    .filter((value) => semver.valid(value))
    .sort(semver.rcompare)) {
    const manifest = await readRegistryVersion({ doc, version })
    if (
      Object.keys({ ...manifest?.dependencies, ...manifest?.peerDependencies }).some((name) =>
        names.has(name),
      )
    ) {
      return true
    }
  }
  return false
}

function checkSelectedRelationships({
  core,
  plan,
  selected,
}: {
  core: Set<string>
  plan: UpgradePlan
  selected: Map<string, { manifest: RegistryVersion; version: string }>
}): void {
  for (const [name, { manifest }] of selected) {
    if (core.has(name)) {
      continue
    }
    for (const [peer, range] of Object.entries({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      const directDependency = peer.startsWith('@payloadcms/')
        ? plan.project.dependencies.find((dependency) => dependency.name === peer)
        : undefined
      const peerVersion =
        selected.get(peer)?.version ??
        directDependency?.currentVersion ??
        (directDependency && semver.valid(directDependency.spec))
      if (peerVersion && !semver.satisfies(peerVersion, range)) {
        plan.blockers.push(
          `${name} requires ${peer}@${range}, but the plan selects ${peerVersion}. Resolve this compatibility conflict first.`,
        )
      } else if (
        !peerVersion &&
        directDependency &&
        semver.validRange(directDependency.spec) &&
        !semver.intersects(directDependency.spec, range)
      ) {
        plan.blockers.push(
          `${name} requires ${peer}@${range}, but this project declares ${directDependency.spec}. Resolve this compatibility conflict first.`,
        )
      }
    }
  }
}

function inspectOverrides({ core, plan }: { core: Set<string>; plan: UpgradePlan }): void {
  const workspace = ancestorDirectories({ projectDir: plan.project.projectDir }).find((directory) =>
    existsSync(join(directory, 'pnpm-workspace.yaml')),
  )
  if (workspace) {
    try {
      const result = spawnSync('pnpm', ['config', 'get', 'overrides', '--json'], {
        cwd: plan.project.projectDir,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        timeout: 10000,
      })
      if (result.error || result.status !== 0) {
        throw new Error('Could not read workspace overrides')
      }
      const overrides = asRecord(JSON.parse(result.stdout.trim() || '{}'))
      if (
        Object.keys(overrides).some((selector) => {
          const name = selectorPackageName({ selector })
          return core.has(name) || name.startsWith('@payloadcms/')
        })
      ) {
        plan.blockers.push(
          `Resolve Payload overrides in ${join(workspace, 'pnpm-workspace.yaml')} manually before upgrading.`,
        )
      }
    } catch {
      plan.blockers.push(
        'Could not inspect pnpm workspace overrides. Run pnpm config get overrides --json and resolve any Payload overrides before upgrading.',
      )
    }
  }
  for (const { block, label } of overrideBlocks({ data: plan.project.data })) {
    for (const [selector, value] of Object.entries(block)) {
      const name = selectorPackageName({ selector })
      if (core.has(name)) {
        const pin = overrideVersion({ value })
        if (pin && (!isRegistrySpec({ spec: pin }) || pin === '-')) {
          plan.blockers.push(
            `${label}.${selector} uses a custom replacement. Resolve it manually before upgrading.`,
          )
          continue
        }
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          if ('.' in value) {
            plan.overridesRemoved.push(`${label}.${selector}..`)
          }
        } else {
          plan.overridesRemoved.push(`${label}.${selector}`)
        }
      } else {
        const dependency = plan.project.dependencies.find((entry) => entry.name === name)
        if (
          dependency &&
          name.startsWith('@payloadcms/') &&
          !name.startsWith('@payloadcms/eslint') &&
          overrideTargetSelector({ selector }) !== name
        ) {
          plan.blockers.push(
            `${label}.${selector} is a version-scoped independent package override. Resolve it manually before upgrading.`,
          )
          continue
        }
        if (!dependency || !selectorApplies({ dependency, selector })) {
          continue
        }
        const pin = overrideVersion({ value })
        const change = plan.changes.find((entry) => entry.name === name)
        if (
          change &&
          pin !== undefined &&
          pin !== `$${name}` &&
          (!semver.validRange(pin) || !semver.satisfies(change.to, pin))
        ) {
          plan.blockers.push(
            `${label}.${selector} pins an independent package. Resolve the override before upgrading ${name} to ${change.to}.`,
          )
        }
      }
    }
  }
}

function independentConstraints({
  dependency,
  project,
}: {
  dependency: Dependency
  project: ProjectInfo
}): string[] {
  return overrideBlocks({ data: project.data }).flatMap(({ block }) =>
    Object.entries(block).flatMap(([selector, value]) => {
      if (
        selectorPackageName({ selector }) !== dependency.name ||
        !selectorApplies({ dependency, selector })
      ) {
        return []
      }
      const pin = overrideVersion({ value })
      if (pin === undefined || pin === `$${dependency.name}`) {
        return []
      }
      return [pin]
    }),
  )
}

function overrideVersion({ value }: { value: unknown }): string | undefined {
  return typeof value === 'string'
    ? value
    : typeof asRecord(value)['.'] === 'string'
      ? (asRecord(value)['.'] as string)
      : undefined
}

function selectorApplies({
  dependency,
  selector,
}: {
  dependency: Dependency
  selector: string
}): boolean {
  const leaf = overrideTargetSelector({ selector })
  const versionAt = leaf.indexOf('@', 1)
  if (versionAt === -1) {
    return true
  }
  const range = leaf.slice(versionAt + 1)
  return (
    !semver.validRange(range) ||
    (dependency.currentVersion
      ? semver.satisfies(dependency.currentVersion, range)
      : !semver.validRange(dependency.spec) || semver.intersects(dependency.spec, range))
  )
}

function selectorPackageName({ selector }: { selector: string }): string {
  const leaf = overrideTargetSelector({ selector })
  const versionAt = leaf.indexOf('@', 1)
  return versionAt === -1 ? leaf : leaf.slice(0, versionAt)
}

function overrideTargetSelector({ selector }: { selector: string }): string {
  // Match pnpm's parent delimiter without splitting comparisons like @>= or || >.
  const separatorIndex = selector.search(/[^ |@]>/)
  return (separatorIndex === -1 ? selector : selector.slice(separatorIndex + 2))
    .trim()
    .replace(/^\*\*\//, '')
}

function overrideBlocks({ data }: { data: Record<string, unknown> }): {
  block: Record<string, unknown>
  label: string
  owner: Record<string, unknown>
  property: string
}[] {
  const pnpm = asRecord(data.pnpm)
  const roots = [
    { block: asRecord(data.overrides), label: 'overrides', owner: data, property: 'overrides' },
    {
      block: asRecord(data.resolutions),
      label: 'resolutions',
      owner: data,
      property: 'resolutions',
    },
    {
      block: asRecord(pnpm.overrides),
      label: 'pnpm.overrides',
      owner: pnpm,
      property: 'overrides',
    },
  ]
  type Block = (typeof roots)[number]
  const blocks: Block[] = []
  function collect({ entry }: { entry: Block }): void {
    blocks.push(entry)
    for (const [property, value] of Object.entries(entry.block)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        collect({
          entry: {
            block: asRecord(value),
            label: `${entry.label}.${property}`,
            owner: entry.block,
            property,
          },
        })
      }
    }
  }
  for (const entry of roots) {
    collect({ entry })
  }
  return blocks
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function npmMetadata({
  command = 'view',
  fields = [],
  name,
  projectDir,
  version,
}: {
  command?: 'dist-tags' | 'view'
  fields?: string[]
  name: string
  projectDir: string
  version?: string
}): Promise<unknown> {
  if (
    !/^(?:@[\w.-]+\/)?[\w.-]+$/.test(name) ||
    (version && version !== 'x' && !semver.valid(version))
  ) {
    return Promise.reject(new Error(`Invalid registry package: ${name}.`))
  }
  return new Promise((resolveResult, reject) => {
    execFile(
      'npm',
      command === 'dist-tags'
        ? ['dist-tag', 'ls', name, '--json']
        : ['view', `${name}${version ? `@${version}` : ''}`, ...fields, '--json'],
      {
        cwd: projectDir,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        shell: process.platform === 'win32',
        env: { ...process.env, npm_config_update_notifier: 'false' },
      },
      (error, stdout) => {
        if (error) {
          reject(
            new Error(
              `Could not read registry metadata for ${name}${version ? `@${version}` : ''}. Check npm registry access in this project.`,
            ),
          )
        } else {
          try {
            // npm dist-tag currently prints "tag: version" even with --json.
            // Keep accepting JSON as well for npm versions that support it.
            if (command === 'dist-tags' && !stdout.trim().startsWith('{')) {
              const entries = stdout
                .trim()
                .split('\n')
                .map((line) => line.trim().split(/:\s+/))
              if (entries.some(([tag, release]) => !tag || !semver.valid(release))) {
                throw new Error('Invalid dist-tag metadata')
              }
              resolveResult(Object.fromEntries(entries))
            } else {
              resolveResult(JSON.parse(stdout))
            }
          } catch {
            reject(new Error(`The npm registry returned invalid metadata for ${name}.`))
          }
        }
      },
    )
  })
}
