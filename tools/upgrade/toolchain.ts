import { createHash } from 'node:crypto'
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

export function assertMigrationNodeVersion({
  data,
  resolved,
}: {
  data: Record<string, unknown>
  resolved: ResolvedVersions
}): void {
  const running = process.versions.node
  const projectNode = asRecord(data.engines).node
  const requirement = typeof projectNode === 'string' ? projectNode : resolved.enginesNode
  if (!semver.satisfies(running, resolved.enginesNode) || !semver.satisfies(running, requirement)) {
    throw new Error(
      `Node v${running} detected.\nPayload v${semver.major(resolved.payloadVersion)} requires Node ${resolved.enginesNode}.${requirement !== resolved.enginesNode ? `\nThis project requires Node ${requirement}.` : ''}\n\nSwitch to a supported Node version, then rerun this command.\nNo files have been changed.`,
    )
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
  const engines = isRecord(data.engines) ? data.engines : {}
  const nodeSpec = engines.node
  const nodeRange = typeof nodeSpec === 'string' ? semver.validRange(nodeSpec) : null
  const isCompatible = nodeRange !== null && semver.subset(nodeRange, resolved.enginesNode)
  if (
    nodeSpec !== undefined &&
    !isCompatible &&
    (!nodeRange || !semver.subset(resolved.enginesNode, nodeRange))
  ) {
    throw new Error(
      `package.json engines.node ${JSON.stringify(nodeSpec)} conflicts with Payload's requirement ${resolved.enginesNode}. Update this constraint manually, then rerun the upgrade. No files have been changed.`,
    )
  }
  const written: string[] = []
  if (writeDepFloor({ name: 'typescript', data, floor: resolved.typescript })) {
    written.push('typescript')
  }
  if (
    writeDepFloor({
      name: '@types/node',
      data,
      floor: resolved.typesNode,
      minimum: `${semver.major(resolved.typesNode)}.0.0`,
    })
  ) {
    written.push('@types/node')
  }

  if (!isCompatible) {
    engines.node = resolved.enginesNode
    data.engines = engines
    written.push('engines.node')
  }

  return written
}

/** Bind the codemod handoff to the manifest and installed versions approved in CPA. */
export function getUpgradePlanHash({ plan }: { plan: UpgradePlan }): string {
  const data = applyUpgradePlan({ plan })
  if (plan.toolchain) {
    writeFloors({ data, resolved: plan.toolchain })
  }
  return createHash('sha256')
    .update(
      JSON.stringify(
        { data, installed: plan.project.dependencies, target: plan.targetVersion },
        (_key, value: unknown) =>
          value && typeof value === 'object' && !Array.isArray(value)
            ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
            : value,
      ),
    )
    .digest('hex')
}

export function assertApprovedUpgradePlan({ plan }: { plan: UpgradePlan }): void {
  const expected = process.env.PAYLOAD_UPGRADE_PLAN_HASH
  if (expected && getUpgradePlanHash({ plan }) !== expected) {
    throw new Error(
      'The upgrade plan changed after approval. Rerun create-payload-app to review a fresh preview.',
    )
  }
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
  assertMigrationNodeVersion({ data, resolved })
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
 * above `minimum` (defaults to `floor`) are left as-is. Returns whether the dep was written.
 */
function writeDepFloor({
  name,
  data,
  floor,
  minimum = floor,
}: {
  data: Record<string, unknown>
  floor: string
  minimum?: string
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
      !isBelowFloor({ floor: minimum, spec })
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
