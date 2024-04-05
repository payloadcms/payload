import type {
  GitRawCommitsOptions,
  ParserOptions,
  WriterOptions,
} from 'conventional-changelog-core'

import { Octokit } from '@octokit/core'
import addStream from 'add-stream'
import conventionalChangelog from 'conventional-changelog'
import { default as getConventionalPreset } from 'conventional-changelog-conventionalcommits'
import { once } from 'events'
import fse from 'fs-extra'
import minimist from 'minimist'
import { simpleGit } from 'simple-git'
import tempfile from 'tempfile'

const { createReadStream, createWriteStream } = fse

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
const git = simpleGit()

type Args = {
  newVersion: string
  dryRun?: boolean
}

export const updateChangelog = async ({ newVersion, dryRun }: Args) => {
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
    conventionalChangelog: unknown
    gitRawCommitsOpts: GitRawCommitsOptions
    parserOpts: ParserOptions
    writerOpts: WriterOptions
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

  const changelogStream = conventionalChangelog(
    // Options
    {
      preset: 'conventionalcommits',
    },
    // Context
    {
      version: newVersion, // next release
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

  // Output to stdout if debug is true
  const emitter = dryRun
    ? changelogStream.pipe(createWriteStream(tmp)).on('finish', () => {
        createReadStream(tmp).pipe(process.stdout)
      })
    : changelogStream
        .pipe(addStream(readStream))
        .pipe(createWriteStream(tmp))
        .on('finish', () => {
          createReadStream(tmp).pipe(createWriteStream(changelogFile))
        })

  // Wait for the stream to finish
  await once(emitter, 'finish')
}

// module import workaround for ejs
if (import.meta.url === `file://${process.argv[1]}`) {
  // This module is being run directly
  const { newVersion } = minimist(process.argv.slice(2))
  updateChangelog({ dryRun: true, newVersion })
    .then(() => {
      console.log('Done')
    })
    .catch((err) => {
      console.error(err)
    })
}

async function createContributorSection(lastTag: string): Promise<string> {
  const commits = await git.log({ from: lastTag, to: 'HEAD' })
  console.log(`Fetching contributors from ${commits.total} commits`)
  const usernames = await Promise.all(
    commits.all.map((c) =>
      octokit
        .request('GET /repos/{owner}/{repo}/commits/{ref}', {
          owner: 'payloadcms',
          repo: 'payload',
          ref: c.hash,
        })
        .then(({ data }) => data.author?.login),
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
