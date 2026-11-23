import semver from 'semver'

import type { FetchRegistry, UpgradePlan } from './index.js'

import { applyUpgradePlan, readRegistryVersion } from './index.js'

/** Required TypeScript floor from the Payload v4 migration guide. */
export const TS_FLOOR = '6.0.3'

export const V4_MIGRATION_GUIDE_URL =
  'https://github.com/payloadcms/payload/blob/main/docs/migration-guide/v4.mdx'

export type ResolvedVersions = {
  /** Copied verbatim into engines.node. */
  enginesNode: string
  /** Newest patch within @payloadcms/next's peer range. REPORT ONLY, never written. */
  nextTarget: null | string
  /** Exact target for the core publish-list packages. */
  payloadVersion: string
  /** TypeScript floor (guide-sourced constant). */
  typescript: string
  /** Newest @types/node patch within the Node major. */
  typesNode: string
}

type ResolveVersionsArgs = {
  fetchRegistry: FetchRegistry
  hasNext?: boolean
  tag: string
}

const DEP_FIELDS = ['dependencies', 'devDependencies'] as const

/**
 * Resolve the v4 target version set from the registry. Reads payload's engines
 * and, for Next projects, @payloadcms/next's peers at the same exact release, then picks the
 * newest satisfying patch for @types/node and next. `nextTarget` is report-only.
 */
export async function resolveVersions({
  fetchRegistry,
  hasNext = true,
  tag,
}: ResolveVersionsArgs): Promise<ResolvedVersions> {
  const payloadDoc = await fetchRegistry('payload')
  const payloadVersion = semver.valid(tag) ?? payloadDoc['dist-tags']?.[tag]
  if (!payloadVersion) {
    throw new Error(`payload has no dist-tag "${tag}" on the npm registry.`)
  }

  const payloadManifest = await readRegistryVersion({ doc: payloadDoc, version: payloadVersion })
  const enginesNode = payloadManifest?.engines?.node
  if (!enginesNode) {
    throw new Error(`payload@${payloadVersion} does not declare engines.node.`)
  }

  const typesNode = await newestWithinMajor({
    fetchRegistry,
    packageName: '@types/node',
    major: nodeMajor({ enginesNode }),
  })
  const nextTarget = hasNext
    ? await resolveNextTarget({ fetchRegistry, tag: payloadVersion })
    : null

  return {
    enginesNode,
    nextTarget,
    payloadVersion,
    typescript: TS_FLOOR,
    typesNode,
  }
}

/** Only major migrations raise these floors; package selection belongs to the shared planner. */
export function writeFloors({
  data,
  resolved,
}: {
  data: Record<string, unknown>
  resolved: ResolvedVersions
}): string[] {
  const written: string[] = []
  if (writeDepFloor({ name: 'typescript', data, floor: resolved.typescript })) {
    written.push('typescript')
  }
  if (writeDepFloor({ name: '@types/node', data, floor: resolved.typesNode })) {
    written.push('@types/node')
  }

  const engines = isRecord(data.engines) ? data.engines : {}
  if (
    engines.node === undefined ||
    isBelowFloor({ floor: resolved.enginesNode, spec: engines.node })
  ) {
    engines.node = resolved.enginesNode
    data.engines = engines
    written.push('engines.node')
  }

  return written
}

/** Preview the same migration floors both CLIs apply after confirmation. */
export function formatMigrationPreview({
  plan,
  resolved,
}: {
  plan: UpgradePlan
  resolved: ResolvedVersions
}): string {
  const data = applyUpgradePlan({ plan })
  const floors = writeFloors({ data, resolved })
  const changes = floors.map((name) => {
    const group =
      name === 'engines.node'
        ? 'engines'
        : ['dependencies', 'devDependencies'].find((group) => name in asRecord(data[group]))!
    const key = name === 'engines.node' ? 'node' : name
    return `  ${group}.${key}: ${JSON.stringify(asRecord(plan.project.data[group])[key] ?? '(absent)')} → ${JSON.stringify(asRecord(data[group])[key])}`
  })
  return [
    ...changes,
    '  This migration includes automated source transforms. Review the v3 -> v4 migration guide for prerequisites and manual steps before continuing:',
    `  ${V4_MIGRATION_GUIDE_URL}`,
  ].join('\n')
}

function nodeMajor({ enginesNode }: { enginesNode: string }): number {
  const min = semver.minVersion(enginesNode)
  if (!min) {
    throw new Error(`Could not parse a Node major from engines.node "${enginesNode}".`)
  }
  return min.major
}

async function newestWithinMajor({
  fetchRegistry,
  packageName,
  major,
}: {
  fetchRegistry: FetchRegistry
  packageName: string
  major: number
}): Promise<string> {
  const doc = await fetchRegistry(packageName)
  const versions = Object.keys(doc.versions ?? {})
  const range = `>=${major}.0.0 <${major + 1}.0.0`
  const best = semver.maxSatisfying(versions, range)
  if (!best) {
    throw new Error(`No ${packageName} version found within major ${major}.`)
  }
  return best
}

async function resolveNextTarget({
  fetchRegistry,
  tag,
}: {
  fetchRegistry: FetchRegistry
  tag: string
}): Promise<null | string> {
  const nextDoc = await fetchRegistry('@payloadcms/next')
  const version = semver.valid(tag) ?? nextDoc['dist-tags']?.[tag]
  const manifest = version ? await readRegistryVersion({ doc: nextDoc, version }) : undefined
  const range = manifest?.peerDependencies?.next
  if (!range) {
    return null
  }
  const versions = Object.keys((await fetchRegistry('next')).versions ?? {})
  return semver.maxSatisfying(versions, range)
}

/**
 * Raise a dep to `floor` wherever it already lives, else add it to devDependencies.
 * Placeholder specs, non-semver specs (e.g. `latest`), and ranges already at or
 * above the floor are left as-is. Returns whether the dep was written.
 */
function writeDepFloor({
  name,
  data,
  floor,
}: {
  data: Record<string, unknown>
  floor: string
  name: string
}): boolean {
  for (const field of DEP_FIELDS) {
    const deps = data[field]
    if (!isRecord(deps) || !(name in deps)) {
      continue
    }
    const spec = deps[name]
    if (
      (typeof spec === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(spec)) ||
      !isBelowFloor({ floor, spec })
    ) {
      return false
    }
    deps[name] = floor
    return true
  }
  const devDeps = isRecord(data.devDependencies) ? data.devDependencies : {}
  devDeps[name] = floor
  data.devDependencies = devDeps
  return true
}

/** True only when `spec` is a semver range whose lowest version is below the floor's. */
function isBelowFloor({ floor, spec }: { floor: string; spec: unknown }): boolean {
  if (typeof spec !== 'string' || !semver.validRange(spec)) {
    return false
  }
  const specMin = semver.minVersion(spec)
  const floorMin = semver.minVersion(floor)
  if (!specMin || !floorMin) {
    return false
  }
  return semver.lt(specMin, floorMin)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
