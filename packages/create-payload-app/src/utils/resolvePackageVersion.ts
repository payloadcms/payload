import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Dist-tag used when the CLI's own version carries no prerelease id. */
const STABLE_TAG = 'latest'

/** Captures the prerelease id, e.g. `beta` from `4.0.0-beta.3`. */
const PRERELEASE_ID_PATTERN = /^\d+\.\d+\.\d+-([\da-z-]+)/i

/**
 * Default npm dist-tag used by the create-payload-app CLI when no
 * `--payload-version` is provided.
 */
export const DEFAULT_PAYLOAD_VERSION_TAG = resolveDefaultPayloadTag()

/**
 * Every package in the monorepo (this one included) is versioned and published in
 * lockstep, so the CLI's own prerelease id is the dist-tag it was installed under
 * (`create-payload-app@beta` -> `beta`). Stable builds resolve to `latest`.
 */
export function resolveDefaultPayloadTag(version: string | undefined = readOwnVersion()): string {
  return version?.match(PRERELEASE_ID_PATTERN)?.[1] ?? STABLE_TAG
}

/**
 * Resolves a package version from either an npm dist-tag (e.g. `beta`) or an
 * explicit version number (e.g. `3.40.0`).
 *
 * A value matching a published dist-tag resolves to that tag's concrete version.
 * Any other value is treated as an explicit version and verified to exist on the
 * registry. Throws if neither a matching tag nor a published version is found.
 */
export async function resolvePackageVersion({
  debug = false,
  packageName = 'payload',
  versionOrTag = 'latest',
}: {
  debug?: boolean
  /**
   * Package name to resolve against the npm registry.
   *
   * @default 'payload'
   */
  packageName?: string
  /**
   * An npm dist-tag (e.g. `latest`, `beta`) or an explicit version (e.g. `3.40.0`).
   *
   * @default 'latest'
   */
  versionOrTag?: string
}): Promise<string> {
  const distTags = await fetchDistTags(packageName)

  const taggedVersion = distTags[versionOrTag]
  if (taggedVersion) {
    if (debug) {
      console.log(`Resolved ${packageName}@${versionOrTag} to ${taggedVersion}`)
    }
    return taggedVersion
  }

  await verifyVersionExists({ packageName, version: versionOrTag })

  if (debug) {
    console.log(`Using ${packageName}@${versionOrTag}`)
  }
  return versionOrTag
}

async function fetchDistTags(packageName: string): Promise<Record<string, string>> {
  const response = await fetch(`https://registry.npmjs.org/-/package/${packageName}/dist-tags`)
  return (await response.json()) as Record<string, string>
}

async function verifyVersionExists({
  packageName,
  version,
}: {
  packageName: string
  version: string
}): Promise<void> {
  const response = await fetch(`https://registry.npmjs.org/${packageName}/${version}`)
  if (response.status !== 200) {
    throw new Error(`No version or tag "${version}" found for package: ${packageName}`)
  }
}

function readOwnVersion(): string | undefined {
  try {
    const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json')
    const { version } = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: unknown }
    return typeof version === 'string' ? version : undefined
  } catch {
    return undefined
  }
}
