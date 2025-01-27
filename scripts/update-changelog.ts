import fse, { createWriteStream, createReadStream } from 'fs-extra'
import { ExecSyncOptions, execSync } from 'child_process'
import chalk from 'chalk'
import path from 'path'
import prompts from 'prompts'
import minimist from 'minimist'
import chalkTemplate from 'chalk-template'
import { PackageDetails, getPackageDetails, showPackageDetails } from './lib/getPackageDetails'
import semver from 'semver'
import addStream from 'add-stream'
import tempfile from 'tempfile'
import concatSream from 'concat-stream'
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
  const packageName = args._[0]

  const packageDetails = await getPackageDetails()
  showPackageDetails(packageDetails)

  let pkg: PackageDetails | undefined
  if (packageName) {
    pkg = packageDetails.find((p) => p.shortName === packageName)
    if (!pkg) {
      abort(`Package not found: ${packageName}`)
    }
  } else {
    ;({ pkg } = (await prompts({
      type: 'select',
      name: 'pkg',
      message: 'Select package to update changelog',
      choices: packageDetails.map((p) => {
        const title = p?.newCommits ? chalk.bold.green(p?.shortName) : p?.shortName
        return {
          title,
          value: p,
        }
      }),
    })) as { pkg: PackageDetails })
  }

  console.log({ pkg })
  if (!pkg) {
    abort()
    process.exit(1)
  }

  // Prefix to find prev tag
  const tagPrefix = pkg.shortName === 'payload' ? 'v' : pkg.prevGitTag.split('/')[0] + '/'

  const generateChangelog = await confirm('Generate changelog?')
  if (!generateChangelog) {
    abort()
  }

  const nextReleaseVersion = semver.inc(pkg.version, bump) as string
  const changelogStream = conventionalChangelog(
    {
      preset: 'conventionalcommits',
      append: true, // Does this work?
      // currentTag: pkg.prevGitTag, // The prefix is added automatically apparently?
      tagPrefix,
      pkg: {
        path: `${pkg.packagePath}/package.json`,
      },
    },
    {
      version: nextReleaseVersion, // next release
    },
    {
      path: 'packages',
      // path: pkg.packagePath,
      // from: pkg.prevGitTag,
      // to: 'HEAD'
    },
  ).on('error', (err) => {
    console.error(err.stack)
    console.error(err.toString())
    process.exit(1)
  })

  const changelogFile = 'CHANGELOG.md'
  const readStream = fse.createReadStream(changelogFile)

  const tmp = tempfile()

  changelogStream
    .pipe(addStream(readStream))
    .pipe(createWriteStream(tmp))
    .on('finish', () => {
      createReadStream(tmp).pipe(createWriteStream(changelogFile))
    })
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
