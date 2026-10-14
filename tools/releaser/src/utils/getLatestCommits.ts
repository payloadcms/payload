import type { ChangelogConfig, RawGitCommit } from 'changelogen'

import { determineSemverChange, getGitDiff, loadChangelogConfig, parseCommits } from 'changelogen'

export async function getLatestCommits(
  fromVersion: string,
  toVersion: string,
  config?: ChangelogConfig,
) {
  if (!config) {
    config = await loadChangelogConfig(process.cwd(), {
      repo: 'payloadcms/payload',
    })
  }
  return parseCommits(await getGitDiff(fromVersion, toVersion), config)
}

export async function getUnconventionalCommits(
  fromVersion: string,
  toVersion: string,
  config?: ChangelogConfig,
): Promise<RawGitCommit[]> {
  if (!config) {
    config = await loadChangelogConfig(process.cwd(), {
      repo: 'payloadcms/payload',
    })
  }
  const rawCommits = (await getGitDiff(fromVersion, toVersion)).filter((commit) =>
    /^[0-9a-f]{7,40}$/.test(commit.shortHash ?? ''),
  )
  const parsedHashes = new Set(parseCommits(rawCommits, config).map((commit) => commit.shortHash))

  return rawCommits.filter((commit) => !parsedHashes.has(commit.shortHash))
}
