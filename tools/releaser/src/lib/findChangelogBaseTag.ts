import semver from 'semver'

export type ReleaseLine = 'beta' | 'canary' | 'latest'

/**
 * The release line a version belongs to: its prerelease id when 'beta'/'canary',
 * else 'latest' (stable). Stable v3 tags, the main line on 3.x, map to 'latest'.
 * It never throws, so every candidate tag gets a line.
 */
export const lineFromVersion = (version: string): ReleaseLine => {
  const preid = semver.prerelease(version)?.[0]
  if (preid === 'beta') {
    return 'beta'
  }
  if (preid === 'canary') {
    return 'canary'
  }
  return 'latest'
}

type Candidate = { tag: string; version: string }

/**
 * Selects the changelog range start: the latest PUBLISHED tag on the same major
 * and same line as `version`. Tolerates a dangling (tagged-but-unpublished) tag
 * with no tag mutation. Falls back to the latest published same-major tag of any
 * line, else undefined (range = repo start).
 */
export const findChangelogBaseTag = async ({
  isPublished,
  listTags,
  version,
}: {
  isPublished: (args: { name: string; version: string }) => Promise<boolean>
  listTags: () => Promise<string[]> | string[]
  version: string
}): Promise<string | undefined> => {
  const major = semver.major(version)
  const line = lineFromVersion(version)

  const candidates: Candidate[] = (await listTags())
    .map((tag) => ({ tag, version: tag.replace(/^v/, '') }))
    .filter((candidate) => semver.valid(candidate.version) !== null)
    .filter((candidate) => candidate.version !== version)
    .filter((candidate) => semver.major(candidate.version) === major)

  const firstPublished = async (list: Candidate[]): Promise<string | undefined> => {
    const sorted = [...list].sort((a, b) => semver.rcompare(a.version, b.version))
    for (const candidate of sorted) {
      // The monorepo release version tracks the root 'payload' package, so its
      // registry presence is the proxy for "this version was published".
      if (await isPublished({ name: 'payload', version: candidate.version })) {
        return candidate.tag
      }
    }
    return undefined
  }

  const sameLine = candidates.filter((candidate) => lineFromVersion(candidate.version) === line)
  const sameLineMatch = await firstPublished(sameLine)
  if (sameLineMatch) {
    return sameLineMatch
  }

  return firstPublished(candidates)
}
