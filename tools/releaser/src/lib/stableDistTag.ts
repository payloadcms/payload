import semver from 'semver'

import { PINNED_MAJOR } from './pinnedMajor.js'

export const OLD_MAJOR_DIST_TAG = 'payload-3'

export type StableDistTag = 'latest' | typeof OLD_MAJOR_DIST_TAG

/**
 * Picks the stable dist-tag from the version currently on npm `latest`. A newer major on
 * `latest` must never be overwritten by the pinned major.
 */
export function selectStableDistTag({
  latestVersion,
}: {
  latestVersion: string | undefined
}): StableDistTag {
  if (latestVersion === undefined) {
    return 'latest'
  }

  return parseMajor({ latestVersion }) > PINNED_MAJOR ? OLD_MAJOR_DIST_TAG : 'latest'
}

/**
 * Independent check run right before publish. Re-derives the rule from `latestVersion`
 * rather than reusing the selector, so a selector bug cannot also pass the guard.
 */
export function assertStableDistTagSafe(params: {
  latestVersion: string | undefined
  name: string
  tag: string
}): asserts params is { latestVersion: string | undefined; name: string; tag: StableDistTag } {
  const { name, latestVersion, tag } = params

  if (tag !== 'latest' && tag !== OLD_MAJOR_DIST_TAG) {
    throw new Error(`Refusing to publish ${name}: dist-tag "${tag}" is not allowed for stable.`)
  }

  if (
    tag === 'latest' &&
    latestVersion !== undefined &&
    parseMajor({ latestVersion }) > PINNED_MAJOR
  ) {
    throw new Error(
      `Refusing to publish ${name} to "latest": npm latest is ${latestVersion}, a newer major than v${PINNED_MAJOR}.`,
    )
  }
}

/** Reads sequentially; any registry failure rejects so no tag is ever defaulted. */
export async function resolveStableDistTags({
  getLatestVersion,
  names,
}: {
  getLatestVersion: (args: { name: string }) => Promise<string | undefined>
  names: string[]
}): Promise<Map<string, StableDistTag>> {
  const tags = new Map<string, StableDistTag>()

  for (const name of names) {
    const latestVersion = await getLatestVersion({ name })
    const tag = selectStableDistTag({ latestVersion })
    assertStableDistTagSafe({ name, latestVersion, tag })
    tags.set(name, tag)
  }

  return tags
}

function parseMajor({ latestVersion }: { latestVersion: string }): number {
  if (semver.valid(latestVersion) === null) {
    throw new Error(`npm latest version "${latestVersion}" is not valid semver.`)
  }

  return semver.major(latestVersion)
}
