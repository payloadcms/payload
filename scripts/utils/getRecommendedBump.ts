import type { ChangelogConfig } from 'changelogen'

import { determineSemverChange, getGitDiff, loadChangelogConfig, parseCommits } from 'changelogen'

import { getLatestCommits } from './getLatestCommits.js'

export async function getRecommendedBump(
  fromVersion: string,
  toVersion: string,
  config?: ChangelogConfig,
) {
  if (!config) {
    config = await loadChangelogConfig(process.cwd(), {
      repo: 'payloadcms/payload',
    })
  }
  const commits = await getLatestCommits(fromVersion, toVersion, config)
  const bumpType = determineSemverChange(commits, config)
  return bumpType === 'major' ? 'minor' : bumpType
}
