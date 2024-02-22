import addStream from 'add-stream'
import conventionalChangelog from 'conventional-changelog'
import util from 'util'
import fs from 'fs'
import fse, { createReadStream, createWriteStream } from 'fs-extra'
import minimist from 'minimist'
import path from 'path'
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

  const commits = await simpleGit().log({ from: lastTag, to: 'HEAD' })

  const authorHashMap: Record<string, string> = Object.fromEntries(
    await Promise.all(
      commits.all.map((c) =>
        octokit
          .request('GET /repos/{owner}/{repo}/commits/{ref}', {
            owner: 'denolfe',
            repo: 'payload-fork',
            ref: c.hash,
          })
          .then(({ data }) => [c.hash, data.author?.login] as [string, string]),
      ),
    ),
  )

  console.log({ authorHashMap })

  const nextReleaseVersion = semver.inc(monorepoVersion, bump, undefined, preId) as string
  const commitPartial = fs.readFileSync(path.resolve(__dirname, 'commit.hbs'), 'utf-8')

  const changelogStream = conventionalChangelog(
    // Options
    {
      preset: 'conventionalcommits',
      // tagPrefix: 'v',
      transform: (commit, cb) => {
        // Populate username property on each commit
        const found = commits.all.find((c) => c.hash === commit.hash)
        if (found) {
          commit.username = authorHashMap[found.hash]
        }
        cb(null, commit)
      },
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
    // WriterOptions
    {
      // Default commit.hbs with a 'by @username' at the end
      commitPartial,
    },
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

// if file is executed directly, run the function
if (require.main === module) {
  const { pkg, bump, preId } = minimist(process.argv.slice(2))
  updateChangelog({ bump, preId, debug: true })
}

export function logDeep(obj: any, message?: string): void {
  if (message) {
    // eslint-disable-next-line no-console
    console.log(`:>> ${message}`)
  }
  // eslint-disable-next-line no-console
  console.log(util.inspect(obj, false, null, true /* enable colors */))
}
