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
// import tempfile from 'tempfile'
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

  // TODO: Locate changelog

  // Prefix to find prev tag
  const tagPrefix = pkg.shortName === 'payload' ? 'v' : pkg.prevGitTag.split('/')[0] + '/'

  const config = {
    // infile: 'CHANGELOG.md',
    preset: 'conventionalcommits',
    append: true, // Does this work?
    currentTag: pkg.prevGitTag, // The prefix is added automatically apparently?
    tagPrefix,
    pkg: {
      path: `${pkg.packagePath}/package.json`,
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

  console.log({ config })

  const generateChangelog = await confirm('Generate changelog?')
  if (!generateChangelog) {
    abort()
  }

  const nextReleaseVersion = semver.inc(pkg.version, bump) as string
  const changelogStream = conventionalChangelog(
    { ...config, debug: console.debug.bind(console) },
    {
      version: nextReleaseVersion, // next release
    },
    {
      // path: pkg.packagePath,
      path: 'packages',
      // from: pkg.prevGitTag,
      // to: 'HEAD'
    },
  ).on('error', (err) => {
    // if (flags.verbose) {
    console.error(err.stack)
    // } else {
    console.error(err.toString())
    // }
    process.exit(1)
  })

  // const outStream = createWriteStream('NEW.md')
  const changelogFile = 'CHANGELOG.md'
  const readStream = fse.createReadStream(changelogFile)
  // changelogStream.pipe(outStream)

  const outfile = 'CHANGELOG.md'
  // const tmp = tempfile()

  // create temp file
  const tmp = 'TMP.md'
  fse.writeFileSync('TMP.md', '')

  const writeStream = createWriteStream(outfile)

  changelogStream
    .pipe(addStream(readStream))
    .pipe(createWriteStream(tmp))
    .on('finish', () => {
      createReadStream(tmp).pipe(createWriteStream(outfile))
    })

  const tempFileFullPath = path.resolve(tmp)
  fse.unlinkSync(tempFileFullPath)

  // delete temp file

  // const currentChangelog = await getStream(fse.createReadStream('CHANGELOG.md'))
  // const changelogWritableStream = fse.createWriteStream('NEW.md')

  // For Debug
  // changelogStream.pipe(process.stdout)

  // TODO: Update the changelog
  // const appendToChangelog = await confirm('Append to changelog?')
  // if (appendToChangelog) {
  //   console.log(chalk.bold.green('DRYRUN: Appending to changelog...'))
  // }

  // const prevChangelog = await getStream(fse.createReadStream('CHANGELOG.md'))
  // const changelog = await getStream(changelogStream)
  // console.log({ changelog })
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
