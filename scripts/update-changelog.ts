import fse from 'fs-extra'
import { ExecSyncOptions, execSync } from 'child_process'
import chalk from 'chalk'
import prompts from 'prompts'
import minimist from 'minimist'
import chalkTemplate from 'chalk-template'
import { PackageDetails, getPackageDetails, showPackageDetails } from './lib/getPackageDetails'
import semver from 'semver'
import getStream from 'get-stream'
import conventionalChangelogCore, {
  Options,
  Context,
  GitRawCommitsOptions,
  ParserOptions,
  WriterOptions,
} from 'conventional-changelog-core'
import conventionalChangelog, { Options as ChangelogOptions } from 'conventional-changelog'

const execOpts: ExecSyncOptions = { stdio: 'inherit' }
const args = minimist(process.argv.slice(2))

async function main() {
  const { tag = 'latest', bump = 'patch' } = args
  const packageDetails = await getPackageDetails()
  showPackageDetails(packageDetails)

  const { packageToUpdateChangelog } = (await prompts({
    type: 'select',
    name: 'packageToUpdateChangelog',
    message: 'Select package to update changelog',
    choices: packageDetails.map((p) => {
      const title = p?.newCommits ? chalk.bold.green(p?.shortName) : p?.shortName
      return {
        title,
        value: p,
      }
    }),
  })) as { packageToUpdateChangelog: PackageDetails }

  console.log({ packageToUpdateChangelog })

  // TODO: Locate changelog

  const config = {
    preset: 'conventionalcommits',
    append: true, // Does this work?
    tagPrefix: packageToUpdateChangelog.prevGitTag.split('/')[0] + '/',
    pkg: {
      path: `${packageToUpdateChangelog.packagePath}/package.json`,
    },
    writerOpts: {
      commitGroupsSort: (a, b) => {
        const groupOrder = ['Features', 'Bug Fixes', 'Documentation']
        return groupOrder.indexOf(a.title) - groupOrder.indexOf(b.title)
      },

      // Scoped commits at the end, alphabetical sort
      commitsSort: (a, b) => {
        if (a.scope || b.scope) {
          if (!a.scope) return -1
          if (!b.scope) return 1
          return a.scope === b.scope
            ? a.subject.localeCompare(b.subject)
            : a.scope.localeCompare(b.scope)
        }

        // Alphabetical sort
        return a.subject.localeCompare(b.subject)
      },
    },
  }

  const changelogStream = conventionalChangelog(
    { ...config, debug: console.debug.bind(console) },
    {
      version: semver.inc(packageToUpdateChangelog.version, bump) as string, // next release
    },
    {
      path: packageToUpdateChangelog.packagePath,
    },
  ).on('error', (err) => {
    // if (flags.verbose) {
    console.error(err.stack)
    // } else {
    console.error(err.toString())
    // }
    process.exit(1)
  })

  changelogStream.pipe(process.stdout)
  // TODO: Update the changelog
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function abort(message = 'Abort', exitCode = 1) {
  console.error(chalk.bold.red(`\n${message}\n`))
  process.exit(exitCode)
}

async function confirm(message: string): Promise<boolean> {
  const { confirm } = await prompts(
    {
      name: 'confirm',
      initial: false,
      message,
      type: 'confirm',
    },
    {
      onCancel: () => {
        abort()
      },
    },
  )

  return confirm
}
