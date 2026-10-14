import semver from 'semver'

import type { PackageDetails } from './getPackageDetails.js'
import type { PublishResult } from './runPublishSequence.js'

import { PINNED_MAJOR } from './pinnedMajor.js'

export const OLD_MAJOR_DIST_TAG = 'payload-3'

export type StableDistTag = 'latest' | typeof OLD_MAJOR_DIST_TAG

/** Reads the version npm serves as `latest`; `undefined` only when the package was never published. */
export type GetLatestVersion = (args: { name: string }) => Promise<string | undefined>

/**
 * Picks the stable dist-tag from the version currently on npm `latest`. A newer major on
 * `latest` must never be overwritten by the pinned major.
 */
export function selectStableDistTag({
  latestVersion,
  name,
}: {
  latestVersion: string | undefined
  name: string
}): StableDistTag {
  if (latestVersion === undefined) {
    return 'latest'
  }

  return parseMajor({ latestVersion, name }) > PINNED_MAJOR ? OLD_MAJOR_DIST_TAG : 'latest'
}

/**
 * Guard for a chosen tag against a given npm `latest`. Re-derives the rule from `latestVersion`
 * rather than reusing the selector, so a selector bug cannot also pass the guard. An explicit
 * `--tag latest` moves `latest` even backwards, so publishing `version` under a newer `latest`
 * (for example resuming an older release) is refused.
 */
export function assertStableDistTagSafe(params: {
  latestVersion: string | undefined
  name: string
  tag: string
  version: string
}): asserts params is {
  latestVersion: string | undefined
  name: string
  tag: StableDistTag
  version: string
} {
  const { name, latestVersion, tag, version } = params

  if (tag !== 'latest' && tag !== OLD_MAJOR_DIST_TAG) {
    throw new Error(`Refusing to publish ${name}: dist-tag "${tag}" is not allowed for stable.`)
  }

  if (tag !== 'latest' || latestVersion === undefined) {
    return
  }

  if (parseMajor({ latestVersion, name }) > PINNED_MAJOR) {
    throw new Error(
      `Refusing to publish ${name} to "latest": npm latest is ${latestVersion}, a newer major than v${PINNED_MAJOR}.`,
    )
  }

  if (semver.gt(latestVersion, version)) {
    throw new Error(
      `Refusing to publish ${name}@${version} to "latest": npm latest is already ${latestVersion}.`,
    )
  }
}

/** Reads sequentially; any registry failure rejects so no tag is ever defaulted. */
export async function resolveStableDistTags({
  getLatestVersion,
  names,
  version,
}: {
  getLatestVersion: GetLatestVersion
  names: string[]
  version: string
}): Promise<Map<string, StableDistTag>> {
  const tags = new Map<string, StableDistTag>()

  for (const name of names) {
    const latestVersion = await getLatestVersion({ name })
    const tag = selectStableDistTag({ latestVersion, name })
    assertStableDistTagSafe({ name, latestVersion, tag, version })
    tags.set(name, tag)
  }

  return tags
}

/**
 * Publishes one package under its resolved stable dist-tag. npm `latest` can move between
 * resolution and this package's turn, so it is read again here and the guard runs on that fresh
 * value. A missing tag, a read failure, or a guard failure returns a failed result, which stops
 * the publish sequence before this package ships.
 */
export async function publishWithStableDistTag({
  distTags,
  dryRun,
  getLatestVersion,
  pkg,
  publish,
  version,
}: {
  distTags: ReadonlyMap<string, StableDistTag>
  dryRun?: boolean
  getLatestVersion: GetLatestVersion
  pkg: Pick<PackageDetails, 'name'>
  publish: (args: { tag: StableDistTag }) => Promise<PublishResult>
  /** The release version being published, which npm `latest` must not be newer than. */
  version: string
}): Promise<PublishResult> {
  const { name } = pkg
  const tag = distTags.get(name)
  if (!tag) {
    return refusePublish({
      name,
      details: `No dist-tag resolved for ${name}; refusing to publish it.`,
    })
  }

  // A dry-run publishes nothing, so it skips the registry read, like the publish pre-check does.
  if (!dryRun) {
    try {
      const latestVersion = await getLatestVersion({ name })
      assertStableDistTagSafe({ latestVersion, name, tag, version })
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err)
      return refusePublish({ name, details: `Dist-tag re-check failed for ${name}: ${reason}` })
    }
  }

  return publish({ tag })
}

function refusePublish({ name, details }: { details: string; name: string }): PublishResult {
  console.error(details)
  return { name, success: false, details }
}

function parseMajor({ latestVersion, name }: { latestVersion: string; name: string }): number {
  if (semver.valid(latestVersion) === null) {
    throw new Error(`npm latest version "${latestVersion}" of ${name} is not valid semver.`)
  }

  return semver.major(latestVersion)
}
