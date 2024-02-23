import addStream from 'add-stream'
import conventionalChangelog from 'conventional-changelog'
import { default as getConventionalPreset } from 'conventional-changelog-conventionalcommits'
import { GitRawCommitsOptions, ParserOptions, WriterOptions } from 'conventional-changelog-core'
import fse, { createReadStream, createWriteStream } from 'fs-extra'
import minimist from 'minimist'
import semver, { ReleaseType } from 'semver'
import tempfile from 'tempfile'

import { Octokit } from '@octokit/core'
import simpleGit from 'simple-git'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
const git = simpleGit()

type Args = {
  bump: ReleaseType
  debug?: boolean
  preId?: string
}

export const updateChangelog = async ({ bump = 'patch', preId, debug }: Args) => {
  const monorepoVersion = fse.readJSONSync('package.json')?.version

  if (!monorepoVersion) {
    throw new Error('Could not find version in package.json')
  }

  const lastTag = (await git.tags()).all.reverse().filter((t) => t.startsWith('v'))?.[0]

  if (monorepoVersion !== lastTag.replace('v', '')) {
    throw new Error(
      `Version in package.json (${monorepoVersion}) does not match last tag (${lastTag})`,
    )
  }

  // Load conventional commits preset and modify it
  const conventionalPreset = (await getConventionalPreset()) as {
    gitRawCommitsOpts: GitRawCommitsOptions
    parserOpts: ParserOptions
    writerOpts: WriterOptions
    recommmendBumpOpts: unknown
    conventionalChangelog: unknown
  }

  // Unbold scope
  conventionalPreset.writerOpts.commitPartial =
    conventionalPreset.writerOpts?.commitPartial?.replace('**{{scope}}:**', '{{scope}}:')

  // Add footer to end of main template
  conventionalPreset.writerOpts.mainTemplate = conventionalPreset.writerOpts?.mainTemplate?.replace(
    /\n*$/,
    '{{footer}}\n',
  )

  // Fetch commits from last tag to HEAD
  const credits = await createContributorSection(lastTag)

  // Add Credits to footer
  conventionalPreset.writerOpts.finalizeContext = (context) => {
    context.footer = credits
    return context
  }

  const nextReleaseVersion = semver.inc(monorepoVersion, bump, undefined, preId) as string

  const changelogStream = conventionalChangelog(
    // Options
    {
      preset: 'conventionalcommits',
    },
    // Context
    {
      version: nextReleaseVersion, // next release
    },
    // GitRawCommitsOptions
    {
      path: 'packages',
    },
    undefined,
    conventionalPreset.writerOpts,
  ).on('error', (err) => {
    console.error(err.stack)
    console.error(err.toString())
    process.exit(1)
  })

  const changelogFile = 'CHANGELOG.md'
  const readStream = fse.createReadStream(changelogFile)

  const tmp = tempfile()

  if (debug) {
    // output only updated changelog from tmp
    changelogStream.pipe(createWriteStream(tmp)).on('finish', () => {
      createReadStream(tmp).pipe(process.stdout)
    })
  } else {
    changelogStream
      .pipe(addStream(readStream))
      .pipe(createWriteStream(tmp))
      .on('finish', () => {
        createReadStream(tmp).pipe(createWriteStream(changelogFile))
      })
  }
}

// If file is executed directly, run the function
if (require.main === module) {
  const { bump, preId } = minimist(process.argv.slice(2))
  updateChangelog({ bump, preId, debug: true })
}

async function createContributorSection(lastTag: string): Promise<string> {
  const commits = await git.log({ from: lastTag, to: 'HEAD' })
  const usernames = await Promise.all(
    commits.all.map((c) =>
      octokit
        .request('GET /repos/{owner}/{repo}/commits/{ref}', {
          owner: 'denolfe', // TODO: Set this safely
          repo: 'payload-fork', // TODO: Set this safely
          ref: c.hash,
        })
        .then(({ data }) => data.author?.login as string),
    ),
  )

  if (!usernames.length) return ''

  // List of unique contributors
  const contributors = Array.from(new Set(usernames)).map((c) => `@${c}`)

  const formats = {
    1: (contributors: string[]) => contributors[0],
    2: (contributors: string[]) => contributors.join(' and '),
    // Oxford comma ;)
    default: (contributors: string[]) => contributors.join(', ').replace(/,([^,]*)$/, ', and$1'),
  }

  const formattedContributors =
    formats[contributors.length]?.(contributors) || formats['default'](contributors)

  const credits = `### Credits\n\nThanks to ${formattedContributors} for their contributions!\n`
  return credits
}
