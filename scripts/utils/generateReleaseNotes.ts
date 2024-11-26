import type { GitCommit } from 'changelogen'

import { execSync } from 'child_process'
import fse from 'fs-extra'
import minimist from 'minimist'
import open from 'open'
import semver from 'semver'

import { getLatestCommits } from './getLatestCommits.js'
import { getRecommendedBump } from './getRecommendedBump.js'

type Args = {
  fromVersion?: string
  toVersion?: string
  bump?: 'major' | 'minor' | 'patch' | 'prerelease'
  dryRun?: boolean
  openReleaseUrl?: boolean
}

type ChangelogResult = {
  /**
   * URL to open releases/new with the changelog pre-filled
   */
  releaseUrl: string
  /**
   * The changelog content, does not include contributors
   */
  changelog: string
  /**
   * The release notes, includes contributors. This is the content used for the releaseUrl
   */
  releaseNotes: string
}

export const generateReleaseNotes = async (args: Args = {}): Promise<ChangelogResult> => {
  const { toVersion = 'HEAD', dryRun, bump, openReleaseUrl } = args

  const fromVersion =
    args.fromVersion || execSync('git describe --match "v*" --tags --abbrev=0').toString().trim()

  const tag = fromVersion.match(/-(\w+)\.\d+$/)?.[1] || 'latest'

  const recommendedBump =
    tag !== 'latest' ? 'prerelease' : await getRecommendedBump(fromVersion, toVersion)

  if (bump && bump !== recommendedBump) {
    console.log(`WARNING: Recommended bump is '${recommendedBump}', but you specified '${bump}'`)
  }

  const calculatedBump = bump || recommendedBump

  const proposedReleaseVersion = 'v' + semver.inc(fromVersion, calculatedBump, undefined, tag)

  console.log({
    tag,
    recommendedBump,
    fromVersion,
    toVersion,
    proposedVersion: proposedReleaseVersion,
  })

  const conventionalCommits = await getLatestCommits(fromVersion, toVersion)

  type SectionKey = 'breaking' | 'feat' | 'fix' | 'perf'

  const sections = conventionalCommits.reduce(
    (sections, c) => {
      if (c.isBreaking) {
        sections.breaking.push(c)
      }

      if (['feat', 'fix', 'perf'].includes(c.type)) {
        sections[c.type].push(c)
      }
      return sections
    },
    { feat: [], fix: [], perf: [], breaking: [] } as Record<SectionKey, GitCommit[]>,
  )

  // Sort commits by scope, unscoped first
  Object.values(sections).forEach((section) => {
    section.sort((a, b) => (a.scope || '').localeCompare(b.scope || ''))
  })

  const stringifiedSections = Object.fromEntries(
    Object.entries(sections).map(([key, commits]) => [
      key,
      commits.map((commit) => formatCommitForChangelog(commit, key === 'breaking')),
    ]),
  )

  // Fetch commits for fromVersion to toVersion
  const contributors = await createContributorSection(conventionalCommits)

  const yyyyMMdd = new Date().toISOString().split('T')[0]
  // Might need to swap out HEAD for the new proposed version
  let changelog = `## [${proposedReleaseVersion}](https://github.com/payloadcms/payload/compare/${fromVersion}...${proposedReleaseVersion}) (${yyyyMMdd})\n\n\n`

  // Add section headers
  if (stringifiedSections.feat.length) {
    changelog += `### 🚀 Features\n\n${stringifiedSections.feat.join('\n')}\n\n`
  }
  if (stringifiedSections.perf.length) {
    changelog += `### ⚡ Performance\n\n${stringifiedSections.perf.join('\n')}\n\n`
  }
  if (stringifiedSections.fix.length) {
    changelog += `### 🐛 Bug Fixes\n\n${stringifiedSections.fix.join('\n')}\n\n`
  }
  if (stringifiedSections.breaking.length) {
    changelog += `### ⚠️ BREAKING CHANGES\n\n${stringifiedSections.breaking.join('\n')}\n\n`
  }

  // Add contributors after writing to file
  const releaseNotes = changelog + contributors

  let releaseUrl = `https://github.com/payloadcms/payload/releases/new?tag=${proposedReleaseVersion}&title=${proposedReleaseVersion}&body=${encodeURIComponent(releaseNotes)}`
  if (tag !== 'latest') {
    releaseUrl += `&prerelease=1`
  }
  if (!openReleaseUrl) {
    await open(releaseUrl)
  }

  return {
    releaseUrl,
    changelog,
    releaseNotes,
  }
}

// Helper functions

async function createContributorSection(commits: GitCommit[]): Promise<string> {
  const contributors = await getContributors(commits)
  if (!contributors.length) {
    return ''
  }

  let contributorsSection = `### 🤝 Contributors\n\n`

  for (const contributor of contributors) {
    contributorsSection += `- ${contributor.name} (@${contributor.username})\n`
  }

  return contributorsSection
}

async function getContributors(commits: GitCommit[]): Promise<Contributor[]> {
  const contributors: Contributor[] = []
  const emails = new Set<string>()

  for (const commit of commits) {
    if (emails.has(commit.author.email) || commit.author.name === 'dependabot[bot]') {
      continue
    }

    const res = await fetch(
      `https://api.github.com/repos/payloadcms/payload/commits/${commit.shortHash}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      },
    )

    if (!res.ok) {
      console.error(await res.text())
      console.log(`Failed to fetch commit: ${res.status} ${res.statusText}`)
      continue
    }

    const { author } = (await res.json()) as { author: { login: string; email: string } }

    // TODO: Handle co-authors

    if (!contributors.some((c) => c.username === author.login)) {
      contributors.push({ name: commit.author.name, username: author.login })
    }
    emails.add(author.email)
  }
  return contributors
}

type Contributor = { name: string; username: string }

function formatCommitForChangelog(commit: GitCommit, includeBreakingNotes = false): string {
  const { scope, references, description, isBreaking } = commit

  let formatted = `* ${scope ? `**${scope}:** ` : ''}${description}`
  references.forEach((ref) => {
    if (ref.type === 'pull-request') {
      // /issues will redirect to /pulls if the issue is a PR
      formatted += ` ([${ref.value}](https://github.com/payloadcms/payload/issues/${ref.value.replace('#', '')}))`
    }

    if (ref.type === 'hash') {
      const shortHash = ref.value.slice(0, 7)
      formatted += ` ([${shortHash}](https://github.com/payloadcms/payload/commit/${shortHash}))`
    }
  })

  if (isBreaking && includeBreakingNotes) {
    // Parse breaking change notes from commit body
    const [rawNotes, _] = commit.body.split('\n\n')
    let notes =
      `  ` +
      rawNotes
        .split('\n')
        .map((l) => `  ${l}`) // Indent notes
        .join('\n')
        .trim()

    // Remove random trailing quotes that sometimes appear
    if (notes.endsWith('"')) {
      notes = notes.slice(0, -1)
    }

    formatted += `\n\n${notes}\n\n`
  }

  return formatted
}

// module import workaround for ejs
if (import.meta.url === `file://${process.argv[1]}`) {
  // This module is being run directly
  const { fromVersion, toVersion, bump, openReleaseUrl } = minimist(process.argv.slice(2))
  generateReleaseNotes({
    bump,
    fromVersion,
    toVersion,
    dryRun: false,
    openReleaseUrl,
  })
    .then(() => {
      console.log('Done')
    })
    .catch((err) => {
      console.error(err)
    })
}
