import type { ChangelogConfig } from 'changelogen'

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
