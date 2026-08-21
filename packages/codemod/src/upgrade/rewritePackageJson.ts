import type { ResolvedVersions } from './types.js'

type RewriteArgs = {
  data: Record<string, unknown>
  resolved: ResolvedVersions
}

export type RewriteSummary = {
  floorsWritten: string[]
  overridesRemoved: string[]
  pinnedPayload: string[]
}

const DEP_FIELDS = ['dependencies', 'devDependencies'] as const

export const isPayloadPackage = (name: string): boolean =>
  name === 'payload' || name.startsWith('@payloadcms/')

/**
 * The `@payloadcms/eslint-*` packages are versioned independently of the core
 * payload packages, so they are tracked on `latest` rather than lockstep-pinned.
 */
export const isPayloadEslintPackage = (name: string): boolean =>
  name.startsWith('@payloadcms/eslint')

/**
 * Mutate `data` in place for a v4 upgrade: exact-pin payload packages, drop
 * payload dependency overrides, and write the toolchain floors. Never touches
 * next/react — the Next.js upgrade is delegated to Next's own workflow.
 * Returns a summary for the report. Idempotent.
 */
export function rewritePackageJson({ data, resolved }: RewriteArgs): RewriteSummary {
  const pinnedPayload = pinPayloadPackages(data, resolved.payloadVersion)
  const overridesRemoved = removePayloadOverrides(data)
  const floorsWritten = writeFloors(data, resolved)
  return { floorsWritten, overridesRemoved, pinnedPayload }
}

function pinPayloadPackages(data: Record<string, unknown>, version: string): string[] {
  const pinned: string[] = []
  for (const field of DEP_FIELDS) {
    const deps = data[field]
    if (!isRecord(deps)) {
      continue
    }
    for (const name of Object.keys(deps)) {
      if (isPayloadEslintPackage(name)) {
        deps[name] = 'latest'
        continue
      }
      if (isPayloadPackage(name)) {
        deps[name] = version
        pinned.push(name)
      }
    }
  }
  return pinned
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
  pinDep(data, 'typescript', resolved.typescript)
  pinDep(data, '@types/node', resolved.typesNode)
  written.push('typescript', '@types/node')

  const engines = isRecord(data.engines) ? data.engines : {}
  engines.node = resolved.enginesNode
  data.engines = engines
  written.push('engines.node')

  return written
}

/** Update a dep wherever it already lives, else add it to devDependencies. */
function pinDep(data: Record<string, unknown>, name: string, version: string): void {
  for (const field of DEP_FIELDS) {
    const deps = data[field]
    if (isRecord(deps) && name in deps) {
      deps[name] = version
      return
    }
  }
  const devDeps = isRecord(data.devDependencies) ? data.devDependencies : {}
  devDeps[name] = version
  data.devDependencies = devDeps
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
