import type { ExecSyncOptions } from 'child_process'
import type execa from 'execa'

import chalk from 'chalk'
import { loadChangelogConfig } from 'changelogen'
import { execSync } from 'child_process'
import fse from 'fs-extra'
import minimist from 'minimist'
import { fileURLToPath } from 'node:url'
import pLimit from 'p-limit'
import path from 'path'
import prompts from 'prompts'
import semver from 'semver'

import type { PackageDetails } from './lib/getPackageDetails.js'

import { getPackageDetails } from './lib/getPackageDetails.js'
import { getPackageRegistryVersions } from './lib/getPackageRegistryVersions.js'
import { getWorkspace } from './lib/getWorkspace.js'
import { packagePublishList } from './lib/publishList.js'
import { getRecommendedBump } from './utils/getRecommendedBump.js'
import { updateChangelog } from './utils/updateChangelog.js'

const npmPublishLimit = pLimit(5)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const cwd = path.resolve(dirname, '..')

const execOpts: ExecSyncOptions = { stdio: 'inherit' }
const execaOpts: execa.Options = { stdio: 'inherit' }

const args = minimist(process.argv.slice(2))

// const {
//   bump = 'patch', // Semver release type
//   changelog = false, // Whether to update the changelog. WARNING: This gets throttled on too many commits
//   'dry-run': dryRun,
//   'git-tag': gitTag = true, // Whether to run git tag and commit operations
//   'git-commit': gitCommit = true, // Whether to run git commit operations
//   tag = 'latest',
// } = args

const dryRun = true

const logPrefix = dryRun ? chalk.bold.magenta('[dry-run] >') : ''

async function main() {
  const workspace = await getWorkspace()
  await workspace.bumpVersion('canary')
  await workspace.build()
  await workspace.publishSync({ dryRun: false, tag: 'canary' })

  header('🎉 Done!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

function abort(message = 'Abort', exitCode = 1) {
  console.error(chalk.bold.red(`\n${message}\n`))
  process.exit(exitCode)
}

function header(message: string, opts?: { enable?: boolean }) {
  const { enable } = opts ?? {}
  if (!enable) return

  console.log(chalk.bold.green(`${message}\n`))
}
