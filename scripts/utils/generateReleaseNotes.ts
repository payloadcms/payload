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

  console.log(`Generating release notes for ${fromVersion} to ${toVersion}...`)

  console.log({
    tag,
    recommendedBump,
    fromVersion,
    toVersion,
    proposedVersion: proposedReleaseVersion,
  })

  const conventionalCommits = await getLatestCommits(fromVersion, toVersion)

  const commitTypesForChangelog = [
    'feat',
    'fix',
    'perf',
    'refactor',
    'docs',
    'style',
    'test',
    'templates',
    'examples',
    'build',
    'ci',
    'chore',
    'breaking',
  ] as const

  type Sections = (typeof commitTypesForChangelog)[number]

  const emojiHeaderMap: Record<Sections, string> = {
    feat: '🚀 Features',
    fix: '🐛 Bug Fixes',
    perf: '⚡ Performance',
    refactor: '🛠 Refactors',
    docs: '📚 Documentation',
    style: '🎨 Styles',
    test: '🧪 Tests',
    templates: '📝 Templates',
    examples: '📓 Examples',
    build: '🔨 Build',
    ci: '⚙️ CI',
    chore: '🏡 Chores',
    breaking: '⚠️ BREAKING CHANGES',
  }

  const sections = conventionalCommits.reduce(
    (sections, c) => {
      if (c.isBreaking) {
        sections.breaking.push(c)
      }

      if (commitTypesForChangelog.includes(c.type as Sections)) {
        if (!sections[c.type]) {
          sections[c.type] = []
        }
        sections[c.type].push(c)
      }

      return sections
    },
    {} as Record<'breaking' | Sections, GitCommit[]>,
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

  for (const section of commitTypesForChangelog) {
    if (stringifiedSections[section]?.length) {
      changelog += `### ${emojiHeaderMap[section]}\n\n${stringifiedSections[section].join('\n')}\n\n`
    }
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
  console.log('Fetching contributors...')
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

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  }

  for (const commit of commits) {
    console.log(`Fetching details for ${commit.message} - ${commit.shortHash}`)
    if (emails.has(commit.author.email) || commit.author.name.includes('[bot]')) {
      continue
    }

    const res = await fetch(
      `https://api.github.com/repos/payloadcms/payload/commits/${commit.shortHash}`,
      {
        headers,
      },
    )

    if (!res.ok) {
      console.error(await res.text())
      console.log(`Failed to fetch commit: ${res.status} ${res.statusText}`)
      continue
    }

    const { author } = (await res.json()) as { author: { login: string; email: string } }

    if (!contributors.some((c) => c.username === author.login)) {
      contributors.push({ name: commit.author.name, username: author.login })
    }
    emails.add(author.email)

    // Check git commit for 'Co-authored-by:' lines
    const coAuthorPattern = /Co-authored-by: (?<name>[^<]+) <(?<email>[^>]+)>/g
    const coAuthors = Array.from(
      commit.body.matchAll(coAuthorPattern),
      (match) => match.groups,
    ).filter((e) => !e.email.includes('[bot]'))

    if (!coAuthors.length) {
      continue
    }

    console.log(
      `Fetching co-author details for hash: ${commit.shortHash}. Co-authors:`,
      coAuthors.map((c) => c.email).join(', '),
    )

    // Attempt to co-authors by email
    await Promise.all(
      (coAuthors || [])
        .map(async ({ name, email }) => {
          // Check if this co-author has already been added
          if (emails.has(email)) {
            return null
          }

          // Get co-author's GitHub username by email
          try {
            const response = await fetch(
              `https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email`,
              {
                headers,
              },
            )

            if (!response.ok) {
              console.log('Bad response from GitHub API fetching co-author by email')
              console.error(response.status)
              return null
            }

            const data = (await response.json()) as { items?: { login: string }[] }
            const user = data.items?.[0]

            if (!user) {
              return null
            }

            console.log(`Found co-author by email: ${user.login}`)

            if (!contributors.some((c) => c.username === user.login)) {
              contributors.push({ name, username: user.login })
            }
            emails.add(email)
            return user.login
          } catch (error) {
            console.log(`ERROR: Failed to fetch co-author by email`)
            console.error(error)
            return null
          }
        })
        .filter(Boolean),
    )
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
