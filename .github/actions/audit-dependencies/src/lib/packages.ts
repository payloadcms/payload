import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { Catalogs } from './catalog'

import { resolveCatalogSpec } from './catalog'

/**
 * Published packages a consumer only ever installs as a devDependency, so a vuln
 * in their graph affects the consumer's dev environment, not shipped product.
 */
export const DEV_TOOLING_DENYLIST: readonly string[] = [
  '@payloadcms/eslint-config',
  '@payloadcms/eslint-plugin',
]

/** Top-level workspace directories that contain package.json manifests we may need to look up. */
export const WORKSPACE_GROUPS: readonly string[] = ['packages', 'templates', 'examples', 'tools']

export type PackageManifest = {
  /** Every declared dependency across all types (prod/dev/peer/optional), for remediation lookups. */
  allDependencies: Record<string, string>
  dependencies: Record<string, string>
  /** The workspace group directory this manifest lives under, e.g. `packages` or `templates`. */
  group: string
  isPrivate: boolean
  name: string
  shortName: string
}

/**
 * Maps a workspace owner to its declared dependency specs (catalog-resolved).
 * Keyed by importer path (`templates/website`) and, for the `packages` group, also
 * by short name (`ui`) so consumer-facing owners resolve too.
 */
export type DeclaredIndex = Map<string, Map<string, string>>

export type ConsumerPackage = {
  dependencies: Record<string, string>
  name: string
  shortName: string
}

/** Reads every package.json under the given workspace groups into manifests (IO). */
export const scanWorkspaceManifests = async ({
  groups = WORKSPACE_GROUPS,
  repoRoot,
}: {
  groups?: readonly string[]
  repoRoot: string
}): Promise<PackageManifest[]> => {
  const perGroup = await Promise.all(groups.map((group) => scanGroup({ group, repoRoot })))
  return perGroup.flat()
}

const scanGroup = async ({
  group,
  repoRoot,
}: {
  group: string
  repoRoot: string
}): Promise<PackageManifest[]> => {
  const groupDir = join(repoRoot, group)
  let entries
  try {
    entries = await readdir(groupDir, { withFileTypes: true })
  } catch {
    // A group directory may not exist in every checkout (e.g. examples); skip it.
    return []
  }

  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  const manifests = await Promise.all(dirs.map((dir) => readManifest({ dir, group, groupDir })))
  return manifests.filter((manifest): manifest is PackageManifest => manifest !== null)
}

/**
 * Selects the consumer-facing set: public packages minus the dev-tooling
 * denylist, with workspace-internal dependencies stripped (each internal
 * package is audited on its own, so we only keep first-party external deps).
 */
export const selectConsumerPackages = (
  manifests: PackageManifest[],
  catalogs: Catalogs,
): ConsumerPackage[] => {
  const internalNames = new Set(manifests.map((manifest) => manifest.name))

  return manifests
    .filter((manifest) => !manifest.isPrivate && !DEV_TOOLING_DENYLIST.includes(manifest.name))
    .map((manifest) => ({
      dependencies: buildExternalDeps(manifest.dependencies, internalNames, catalogs),
      name: manifest.name,
      shortName: manifest.shortName,
    }))
}

/**
 * Builds a lookup of each workspace package's declared dependency specs, with
 * `catalog:` specs resolved to the concrete range. Used to report the version we
 * currently declare and to detect when a fix crosses the current major.
 */
export const buildDeclaredIndex = (
  manifests: PackageManifest[],
  catalogs: Catalogs,
): DeclaredIndex => {
  const index: DeclaredIndex = new Map()
  for (const manifest of manifests) {
    const resolved = new Map<string, string>()
    for (const [name, spec] of Object.entries(manifest.allDependencies)) {
      if (!spec.startsWith('workspace:')) {
        resolved.set(name, resolveCatalogSpec({ catalogs, name, spec }))
      }
    }
    // Key by importer path (matches monorepo owner labels); also by short name for
    // the packages group so consumer-facing owners (e.g. `ui`) resolve.
    index.set(`${manifest.group}/${manifest.shortName}`, resolved)
    if (manifest.group === 'packages') {
      index.set(manifest.shortName, resolved)
    }
  }
  return index
}

const readManifest = async ({
  dir,
  group,
  groupDir,
}: {
  dir: string
  group: string
  groupDir: string
}): Promise<null | PackageManifest> => {
  let raw: string
  try {
    raw = await readFile(join(groupDir, dir, 'package.json'), 'utf8')
  } catch {
    return null
  }

  const pkg: unknown = JSON.parse(raw)
  if (!isRecord(pkg) || typeof pkg.name !== 'string') {
    return null
  }

  return {
    allDependencies: {
      ...toStringRecord(pkg.optionalDependencies),
      ...toStringRecord(pkg.peerDependencies),
      ...toStringRecord(pkg.devDependencies),
      ...toStringRecord(pkg.dependencies),
    },
    dependencies: toStringRecord(pkg.dependencies),
    group,
    isPrivate: pkg.private === true,
    name: pkg.name,
    shortName: dir,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Builds the external production deps to audit for a package: drops
 * workspace-internal deps (audited on their own, and the `workspace:` protocol
 * cannot resolve in the detached temp install), then rewrites `catalog:` specs to
 * the concrete version a consumer receives at publish time.
 */
const buildExternalDeps = (
  dependencies: Record<string, string>,
  internalNames: Set<string>,
  catalogs: Catalogs,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(dependencies)
      .filter(([name, spec]) => !internalNames.has(name) && !spec.startsWith('workspace:'))
      .map(([name, spec]) => [name, resolveCatalogSpec({ catalogs, name, spec })]),
  )

const toStringRecord = (value: unknown): Record<string, string> => {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry
    }
  }
  return result
}
