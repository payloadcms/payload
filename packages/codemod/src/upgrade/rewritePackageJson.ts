import semver from 'semver'

import type { ResolvedVersions } from './types.js'

type RewriteArgs = {
  data: Record<string, unknown>
  resolved: ResolvedVersions
}

export type RewriteSummary = {
  floorsWritten: string[]
  overridesRemoved: string[]
  pinnedPayload: string[]
  placeholdersSkipped: string[]
}

const DEP_FIELDS = ['dependencies', 'devDependencies'] as const

/** Any protocol-prefixed specifier (`workspace:*`, `catalog:`, `link:`, `file:`, `npm:`, a URL). */
const PLACEHOLDER_SPEC = /^[a-z][a-z0-9+.-]*:/i

export const isPayloadPackage = (name: string): boolean =>
  name === 'payload' || name.startsWith('@payloadcms/')

/**
 * The `@payloadcms/eslint-*` packages are versioned independently of the core
 * payload packages, so they are tracked on `latest` rather than lockstep-pinned.
 */
export const isPayloadEslintPackage = (name: string): boolean =>
  name.startsWith('@payloadcms/eslint')

/**
 * A dependency whose version is resolved by the package manager, not a semver
 * range: `workspace:*`, `catalog:`, `link:`, `file:`, `npm:` aliases, URLs.
 * Overwriting one with an exact version would break the link, so it is left as-is.
 */
export const isPlaceholderSpec = (spec: unknown): boolean =>
  typeof spec === 'string' && PLACEHOLDER_SPEC.test(spec)

/**
 * Mutate `data` in place for a v4 upgrade: exact-pin payload packages, drop
 * payload dependency overrides, and write the toolchain floors. Never touches
 * next/react — the Next.js upgrade is delegated to Next's own workflow.
 * Returns a summary for the report. Idempotent.
 */
export function rewritePackageJson({ data, resolved }: RewriteArgs): RewriteSummary {
  const { pinnedPayload, placeholdersSkipped } = pinPayloadPackages(data, resolved.payloadVersion)
  const overridesRemoved = removePayloadOverrides(data)
  const floorsWritten = writeFloors(data, resolved)
  return { floorsWritten, overridesRemoved, pinnedPayload, placeholdersSkipped }
}

function pinPayloadPackages(
  data: Record<string, unknown>,
  version: string,
): { pinnedPayload: string[]; placeholdersSkipped: string[] } {
  const pinned: string[] = []
  const skipped: string[] = []
  for (const field of DEP_FIELDS) {
    const deps = data[field]
    if (!isRecord(deps)) {
      continue
    }
    for (const name of Object.keys(deps)) {
      if (!isPayloadPackage(name)) {
        continue
      }
      // A workspace/catalog/link spec resolves itself; pinning it breaks the link.
      if (isPlaceholderSpec(deps[name])) {
        skipped.push(name)
        continue
      }
      if (isPayloadEslintPackage(name)) {
        deps[name] = 'latest'
        continue
      }
      deps[name] = version
      pinned.push(name)
    }
  }
  return { pinnedPayload: pinned, placeholdersSkipped: skipped }
}

function removePayloadOverrides(data: Record<string, unknown>): string[] {
  const removed: string[] = []

  const pnpm = data.pnpm
  if (isRecord(pnpm) && isRecord(pnpm.overrides)) {
    pruneOverrideBlock(pnpm.overrides, 'pnpm.overrides', removed)
    if (Object.keys(pnpm.overrides).length === 0) {
      delete pnpm.overrides
    }
    if (Object.keys(pnpm).length === 0) {
      delete data.pnpm
    }
  }

  for (const key of ['overrides', 'resolutions'] as const) {
    const block = data[key]
    if (isRecord(block)) {
      pruneOverrideBlock(block, key, removed)
      if (Object.keys(block).length === 0) {
        delete data[key]
      }
    }
  }

  return removed
}

function pruneOverrideBlock(
  block: Record<string, unknown>,
  label: string,
  removed: string[],
): void {
  for (const name of Object.keys(block)) {
    if (isPayloadPackage(name)) {
      delete block[name]
      removed.push(`${label}.${name}`)
    }
  }
}

function writeFloors(data: Record<string, unknown>, resolved: ResolvedVersions): string[] {
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
    if (isPlaceholderSpec(spec) || !isBelowFloor({ floor, spec })) {
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
