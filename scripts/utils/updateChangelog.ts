import addStream from 'add-stream'
import { ExecSyncOptions } from 'child_process'
import conventionalChangelog from 'conventional-changelog'
import fse, { createReadStream, createWriteStream } from 'fs-extra'
import minimist from 'minimist'
import semver, { ReleaseType } from 'semver'
import tempfile from 'tempfile'
import { PackageDetails } from '../lib/getPackageDetails'

type Args = {
  pkg: PackageDetails
  bump: ReleaseType
}

export const updateChangelog = ({ pkg, bump }: Args) => {
  // Prefix to find prev tag
  const tagPrefix = pkg.shortName === 'payload' ? 'v' : pkg.prevGitTag.split('/')[0] + '/'

  const nextReleaseVersion = semver.inc(pkg.version, bump) as string
  const changelogStream = conventionalChangelog(
    {
      preset: 'conventionalcommits',
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
