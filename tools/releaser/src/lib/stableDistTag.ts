import semver from 'semver'

import type { PackageDetails } from './getPackageDetails.js'
import type { PublishResult } from './runPublishSequence.js'

import { PINNED_MAJOR } from './pinnedMajor.js'

export const OLD_MAJOR_DIST_TAG = 'payload-3'

export type StableDistTag = 'latest' | typeof OLD_MAJOR_DIST_TAG

/** Reads the version a dist-tag points to on npm; `undefined` when the package or the tag does not exist. */
export type GetDistTagVersion = (args: {
  name: string
  tag: StableDistTag
}) => Promise<string | undefined>

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

  return parseMajor({ name, tag: 'latest', tagVersion: latestVersion }) > PINNED_MAJOR
    ? OLD_MAJOR_DIST_TAG
    : 'latest'
}

/**
 * Guard for a chosen tag against the npm dist-tags. Re-derives the rule from `latestVersion`
 * rather than reusing the selector, so a selector bug cannot also pass the guard. An explicit
 * `--tag` moves a dist-tag even backwards, so publishing `version` under a tag that points to a
 * newer version (for example resuming an older release) is refused.
 */
export function assertStableDistTagSafe(params: {
  latestVersion: string | undefined
  name: string
  /** The version `payload-3` points to on npm. Required so no caller skips its downgrade check. */
  oldMajorTagVersion: string | undefined
  tag: string
  version: string
}): asserts params is {
  latestVersion: string | undefined
  name: string
  oldMajorTagVersion: string | undefined
  tag: StableDistTag
  version: string
} {
  const { name, latestVersion, oldMajorTagVersion, tag, version } = params

  if (tag !== 'latest' && tag !== OLD_MAJOR_DIST_TAG) {
    throw new Error(`Refusing to publish ${name}: dist-tag "${tag}" is not allowed for stable.`)
  }

  const tagVersion = tag === 'latest' ? latestVersion : oldMajorTagVersion
  if (tagVersion === undefined) {
    return
  }

  const tagMajor = parseMajor({ name, tag, tagVersion })
  if (tag === 'latest' && tagMajor > PINNED_MAJOR) {
    throw new Error(
      `Refusing to publish ${name} to "latest": npm latest is ${tagVersion}, a newer major than v${PINNED_MAJOR}.`,
    )
  }

  if (semver.gt(tagVersion, version)) {
    throw new Error(
      `Refusing to publish ${name}@${version} to "${tag}": npm ${tag} is already ${tagVersion}.`,
    )
  }
}

/** Reads sequentially; any registry failure rejects so no tag is ever defaulted. */
export async function resolveStableDistTags({
  getDistTagVersion,
  names,
  version,
}: {
  getDistTagVersion: GetDistTagVersion
  names: string[]
  version: string
}): Promise<Map<string, StableDistTag>> {
  const tags = new Map<string, StableDistTag>()

  for (const name of names) {
    const latestVersion = await getDistTagVersion({ name, tag: 'latest' })
    const tag = selectStableDistTag({ latestVersion, name })
    const oldMajorTagVersion = await readOldMajorTagVersion({ getDistTagVersion, name, tag })
    assertStableDistTagSafe({ latestVersion, name, oldMajorTagVersion, tag, version })
    tags.set(name, tag)
  }

  return tags
}

/**
 * Publishes one package under its resolved stable dist-tag. npm dist-tags can move between
 * resolution and this package's turn, so they are read again here and the guard runs on those
 * fresh values. A missing tag, a read failure, or a guard failure returns a failed result, which stops
 * the publish sequence before this package ships.
 */
export async function publishWithStableDistTag({
  distTags,
  dryRun,
  getDistTagVersion,
  pkg,
  publish,
  version,
}: {
  distTags: ReadonlyMap<string, StableDistTag>
  dryRun?: boolean
  getDistTagVersion: GetDistTagVersion
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
      const latestVersion = await getDistTagVersion({ name, tag: 'latest' })
      const oldMajorTagVersion = await readOldMajorTagVersion({ getDistTagVersion, name, tag })
      assertStableDistTagSafe({ latestVersion, name, oldMajorTagVersion, tag, version })
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

/** Reads `payload-3` only when it is the chosen tag; `latest` needs no second read. */
function readOldMajorTagVersion({
  getDistTagVersion,
  name,
  tag,
}: {
  getDistTagVersion: GetDistTagVersion
  name: string
  tag: StableDistTag
}): Promise<string | undefined> {
  if (tag !== OLD_MAJOR_DIST_TAG) {
    return Promise.resolve(undefined)
  }

  return getDistTagVersion({ name, tag })
}

function parseMajor({
  name,
  tag,
  tagVersion,
}: {
  name: string
  tag: StableDistTag
  tagVersion: string
}): number {
  if (semver.valid(tagVersion) === null) {
    throw new Error(`npm ${tag} version "${tagVersion}" of ${name} is not valid semver.`)
  }

  return semver.major(tagVersion)
}
