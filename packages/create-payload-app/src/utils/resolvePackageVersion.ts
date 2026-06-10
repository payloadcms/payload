/**
 * Resolves a package version from either an npm dist-tag (e.g. `canary`) or an
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
   * An npm dist-tag (e.g. `latest`, `canary`) or an explicit version (e.g. `3.40.0`).
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
