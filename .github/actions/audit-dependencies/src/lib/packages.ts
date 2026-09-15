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

export type PackageManifest = {
  dependencies: Record<string, string>
  isPrivate: boolean
  name: string
  shortName: string
}

export type ConsumerPackage = {
  dependencies: Record<string, string>
  name: string
  shortName: string
}

/** Reads every package.json under the packages directory into a manifest (IO). */
export const scanPackages = async ({
  repoRoot,
}: {
  repoRoot: string
}): Promise<PackageManifest[]> => {
  const packagesDir = join(repoRoot, 'packages')
  const entries = await readdir(packagesDir, { withFileTypes: true })
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

  const manifests = await Promise.all(dirs.map((dir) => readManifest({ dir, packagesDir })))
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

const readManifest = async ({
  dir,
  packagesDir,
}: {
  dir: string
  packagesDir: string
}): Promise<null | PackageManifest> => {
  let raw: string
  try {
    raw = await readFile(join(packagesDir, dir, 'package.json'), 'utf8')
  } catch {
    return null
  }

  const pkg: unknown = JSON.parse(raw)
  if (!isRecord(pkg) || typeof pkg.name !== 'string') {
    return null
  }

  return {
    dependencies: toStringRecord(pkg.dependencies),
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
