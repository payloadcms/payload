/**
 * Usage: GITHUB_TOKEN=$GITHUB_TOKEN pnpm release --bump <patch|minor>
 *
 * Ensure your GITHUB_TOKEN is set in your environment variables
 * and also has the ability to create releases in the repository.
 */

import type { ExecSyncOptions } from 'child_process'

import { PROJECT_ROOT, ROOT_PACKAGE_JSON } from '@tools/constants'
import chalk from 'chalk'
import { loadChangelogConfig } from 'changelogen'
import { execSync } from 'child_process'
import execa from 'execa'
import fse from 'fs-extra'
import minimist from 'minimist'
import path from 'path'
import prompts from 'prompts'
import semver from 'semver'

import type { StableBump } from './lib/assertBumpPreconditions.js'
import type { PackageDetails } from './lib/getPackageDetails.js'
import type { PublishResult } from './lib/runPublishSequence.js'

import { assertBumpPreconditions } from './lib/assertBumpPreconditions.js'
import { getPackageDetails } from './lib/getPackageDetails.js'
import { getLatestPublishedVersion } from './lib/getPackageRegistryVersions.js'
import { RELEASE_BRANCH } from './lib/pinnedMajor.js'
import { packagePublishList } from './lib/publishList.js'
import { runPublishSequence } from './lib/runPublishSequence.js'
import { publishWithStableDistTag, resolveStableDistTags } from './lib/stableDistTag.js'
import {
  createDraftGitHubRelease,
  NOT_LATEST_PUBLISH_REMINDER,
} from './utils/createDraftGitHubRelease.js'
import { generateReleaseNotes } from './utils/generateReleaseNotes.js'
import { getRecommendedBump } from './utils/getRecommendedBump.js'

// Always execute in project root
const cwd = PROJECT_ROOT
const execOpts: ExecSyncOptions = { stdio: 'inherit', cwd }
const execaOpts: execa.Options = { stdio: 'inherit', cwd }

const args = minimist(process.argv.slice(2))

const {
  bump, // Semver release type: patch or minor
  changelog = false, // Whether to update the changelog. WARNING: This gets throttled on too many commits
  'dry-run': dryRun,
  'git-commit': gitCommit = true, // Whether to run git commit operations
  'git-tag': gitTag = true, // Whether to run git tag and commit operations
  tag, // Rejected: the dist-tag is selected per package from npm
} = args

const logPrefix = dryRun ? chalk.bold.magenta('[dry-run] >') : ''

const cmdRunner =
  (dryRun: boolean, gitTag: boolean) => (cmd: string, execOpts: ExecSyncOptions) => {
    const isGitCommand = cmd.startsWith('git')
    if (dryRun || (isGitCommand && !gitTag)) {
      console.log(logPrefix, cmd)
    } else {
      execSync(cmd, execOpts)
    }
  }

const cmdRunnerAsync =
  (dryRun: boolean) => async (cmd: string, args: string[], options?: execa.Options) => {
    if (dryRun) {
      console.log(logPrefix, cmd, args.join(' '))
      return { exitCode: 0 }
    } else {
      return await execa(cmd, args, options ?? { stdio: 'inherit' })
    }
  }

async function main() {
  console.log({ projectRoot: PROJECT_ROOT })

  if (tag !== undefined) {
    abort('--tag is not supported; the dist-tag is selected per package from npm.')
  }

  // Guards run before any pull, prompt, or write so a refused run has no side effects.
  readGuardedRelease()

  header(`⬇️  Pulling latest from remote...`, { enable: true })
  execSync('git pull', execOpts)

  // The pull can change the committed version, so the guards run again on the pulled state.
  const { bump, monorepoVersion } = readGuardedRelease()

  if (dryRun) {
    console.log(chalk.bold.yellow(chalk.bold.magenta('\n  👀 Dry run mode enabled')))
  }

  console.log({ args })

  const fromVersion = execSync('git describe --match "v*" --tags --abbrev=0').toString().trim()

  const config = await loadChangelogConfig(process.cwd(), {
    repo: 'payloadcms/payload',
  })

  const recommendedBump = (await getRecommendedBump(fromVersion, 'HEAD', config)) || 'patch'

  if (bump !== recommendedBump) {
    console.log(
      chalk.bold.yellow(
        `Recommended bump type is '${recommendedBump}' based on commits since last release`,
      ),
    )
    const confirmBump = await confirm(`Do you want to continue with bump: '${bump}'?`)
    if (!confirmBump) {
      abort()
    }
  }

  const runCmd = cmdRunner(dryRun, gitTag)
  const runCmdAsync = cmdRunnerAsync(dryRun)

  const nextReleaseVersion = semver.inc(monorepoVersion, bump)

  if (!nextReleaseVersion) {
    abort(`Invalid nextReleaseVersion: ${nextReleaseVersion}`)
  }

  // Preview/Update changelog
  header(`${logPrefix}📝 Updating changelog...`)
  const {
    changelog: changelogContent,
    releaseNotes,
    releaseUrl: prefilledReleaseUrl,
  } = await generateReleaseNotes({
    bump,
    dryRun,
    fromVersion,
    toVersion: 'HEAD',
  })

  console.log(chalk.green('\nFull Release Notes:\n\n'))
  console.log(chalk.gray(releaseNotes) + '\n\n')
  console.log(`\n\nRelease URL: ${chalk.dim(prefilledReleaseUrl)}`)

  const packageDetails = await getPackageDetails(packagePublishList)

  // Resolved before any write so a registry failure stops the run with nothing to undo.
  const distTags = await resolveStableDistTags({
    getLatestVersion: getLatestPublishedVersion,
    names: packageDetails.map((p) => p.name),
  })
  if (!distTags.get('payload')) {
    abort(`No dist-tag resolved for 'payload'; refusing to publish ${nextReleaseVersion}.`)
  }

  console.log(chalk.bold(`\n  Version: ${monorepoVersion} => ${chalk.green(nextReleaseVersion)}\n`))
  console.log(chalk.bold.yellow(`  Bump: ${bump}\n`))
  console.log(chalk.bold.green(`  Changes (${packageDetails.length} packages):\n`))
  console.log(
    `${packageDetails.map((p) => `  - ${p.name.padEnd(32)} ${p.version} => ${chalk.green(nextReleaseVersion)}  ${chalk.yellow(`(${distTags.get(p.name) ?? 'no dist-tag'})`)}`).join('\n')}\n`,
  )

  const confirmPublish = await confirm('Are you sure you want to create these versions?')

  if (!confirmPublish) {
    abort()
  }

  // Prebuild all packages
  header(`\n🔨 Prebuilding all packages...`)

  await execa('pnpm', ['install'], execaOpts)

  // Build all packages
  const buildResult = await execa('pnpm', ['build:all:force'], execaOpts)
  if (buildResult.exitCode !== 0) {
    console.error(chalk.bold.red('Build failed'))
    console.log(buildResult.stderr)
    abort('Build failed')
  }

  // Increment all package versions
  header(`${logPrefix}📦 Updating package.json versions...`)
  await Promise.all(
    packageDetails.map(async (pkg) => {
      const packageJsonPath = path.join(PROJECT_ROOT, `${pkg.packagePath}/package.json`)
      const packageJson = await fse.readJSON(packageJsonPath)
      packageJson.version = nextReleaseVersion
      if (!dryRun) {
        await fse.writeJSON(packageJsonPath, packageJson, { spaces: 2 })
      }
    }),
  )

  // Set version in root package.json
  header(`${logPrefix}📦 Updating root package.json...`)
  const rootPackageJson = await fse.readJSON(ROOT_PACKAGE_JSON)
  rootPackageJson.version = nextReleaseVersion
  if (!dryRun) {
    await fse.writeJSON(ROOT_PACKAGE_JSON, rootPackageJson, { spaces: 2 })
  }

  // Commit
  header(`🧑‍💻 Committing changes...`)

  // Commit all staged changes
  runCmd(`git add packages/**/package.json package.json`, execOpts)

  // Wait 500ms to avoid .git/index.lock errors
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (gitCommit) {
    runCmd(`git commit -m "chore(release): v${nextReleaseVersion} [skip ci]"`, execOpts)
  }

  // Tag
  header(`🏷️  Tagging release v${nextReleaseVersion}`, { enable: gitTag })
  runCmd(`git tag -a v${nextReleaseVersion} -m "v${nextReleaseVersion}"`, execOpts)

  // Publishes in topological order and stops at the first failure. The first publish is
  // interactive so the maintainer enters the npm OTP, which npm then honors for 5 minutes.
  const [firstPackage] = packageDetails
  await runPublishSequence({
    packages: packageDetails,
    publishOne: (pkg) =>
      publishWithStableDistTag({
        distTags,
        dryRun,
        getLatestVersion: getLatestPublishedVersion,
        pkg,
        publish: async ({ tag: distTag }) => {
          if (pkg === firstPackage) {
            return publishInteractively({ distTag, pkg, runCmd })
          }
          return await publishSinglePackage(pkg, { distTag, dryRun })
        },
      }),
  })

  header(`🚀 Publishing complete!`)

  const pushTags = await confirm('Push commit and tags to remote?')
  if (pushTags) {
    runCmd(`git push --follow-tags`, execOpts)
    console.log(chalk.bold.green('Commit and tags pushed to remote'))
  }

  const createDraftRelease = await confirm('Create draft release on GitHub?')
  if (createDraftRelease) {
    try {
      const makeLatest = distTags.get('payload') === 'latest'
      const { releaseUrl: draftReleaseUrl } = await createDraftGitHubRelease({
        branch: RELEASE_BRANCH,
        makeLatest,
        releaseNotes,
        tag: `v${nextReleaseVersion}`,
      })
      console.log(chalk.bold.green(`Draft release created on GitHub: ${draftReleaseUrl}`))
      if (!makeLatest) {
        console.log(chalk.bold.yellow(NOT_LATEST_PUBLISH_REMINDER))
      }
    } catch (error: unknown) {
      console.log(chalk.bold.red('\nFull Release Notes:\n\n'))
      console.log(chalk.gray(releaseNotes) + '\n\n')
      console.log(`\n\nRelease URL: ${chalk.dim(prefilledReleaseUrl)}`)
      console.log(
        chalk.bold.red(
          `Error creating draft release on GitHub: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
        ),
      )
      console.log(
        chalk.bold.red(
          `Use the above link to create the release manually and optionally add the release notes.`,
        ),
      )
    }
  }
  header('🎉 Done!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

/** Runs the stable-bump guards against the current branch and committed version. */
function readGuardedRelease(): { bump: StableBump; monorepoVersion: string } {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd }).toString().trim()
  const monorepoVersion: unknown = fse.readJSONSync(ROOT_PACKAGE_JSON)?.version

  if (typeof monorepoVersion !== 'string' || !monorepoVersion) {
    return abort('Could not find version in package.json')
  }

  const preconditions = {
    branch,
    bump: typeof bump === 'string' ? bump : String(bump),
    hasGithubToken: Boolean(process.env.GITHUB_TOKEN),
    version: monorepoVersion,
  }

  try {
    assertBumpPreconditions(preconditions)
  } catch (error: unknown) {
    return abort(error instanceof Error ? error.message : JSON.stringify(error))
  }

  return { bump: preconditions.bump, monorepoVersion }
}

/** Inherits stdio so npm can prompt for the OTP. */
function publishInteractively({
  distTag,
  pkg,
  runCmd,
}: {
  distTag: string
  pkg: PackageDetails
  runCmd: (cmd: string, execOpts: ExecSyncOptions) => void
}): PublishResult {
  try {
    runCmd(`pnpm publish -C ${pkg.packagePath} --no-git-checks --tag ${distTag}`, execOpts)
    return { name: pkg.name, success: true }
  } catch (err: unknown) {
    return {
      name: pkg.name,
      details: `Interactive publish failed for ${pkg.name}: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
      success: false,
    }
  }
}

async function publishSinglePackage(
  pkg: PackageDetails,
  opts: { distTag: string; dryRun?: boolean },
) {
  const { distTag, dryRun = false } = opts
  console.log(chalk.bold(`🚀 ${pkg.name} publishing...`))

  try {
    const cmdArgs = ['publish', '-C', pkg.packagePath, '--no-git-checks', '--tag', distTag]
    if (dryRun) {
      cmdArgs.push('--dry-run')
      console.log(chalk.gray(`\n${logPrefix} pnpm ${cmdArgs.join(' ')}\n`))
    }
    const { exitCode, stderr } = await execa('pnpm', cmdArgs, {
      cwd,
      stdio: ['ignore', 'ignore', 'pipe'],
      // stdio: 'inherit',
    })

    if (exitCode !== 0) {
      console.log(chalk.bold.red(`\n\n❌ ${pkg.name} ERROR: pnpm publish failed\n\n${stderr}`))

      // Retry publish
      console.log(chalk.bold.yellow(`\nRetrying publish for ${pkg.name}...`))
      const { exitCode: retryExitCode, stderr: retryStdError } = await execa('pnpm', cmdArgs, {
        cwd,
        stdio: 'inherit', // log full output
      })

      if (retryExitCode !== 0) {
        console.error(
          chalk.bold.red(
            `\n\n❌ ${pkg.name} ERROR: pnpm publish failed on retry\n\n${retryStdError}`,
          ),
        )
      }

      return {
        name: pkg.name,
        details: `Exit Code: ${retryExitCode}, stderr: ${retryStdError}`,
        success: false,
      }
    }

    console.log(`${logPrefix} ${chalk.green(`✅ ${pkg.name} published`)}`)
    return { name: pkg.name, success: true }
  } catch (err: unknown) {
    console.error(err)
    return {
      name: pkg.name,
      details:
        err instanceof Error
          ? `Error publishing ${pkg.name}: ${err.message}`
          : `Unexpected error publishing ${pkg.name}: ${JSON.stringify(err)}`,
      success: false,
    }
  }
}

function abort(message = 'Abort', exitCode = 1): never {
  console.error(chalk.bold.red(`\n${message}\n`))
  process.exit(exitCode)
}

async function confirm(message: string): Promise<boolean> {
  const { confirm } = await prompts(
    {
      name: 'confirm',
      type: 'confirm',
      initial: false,
      message,
    },
    {
      onCancel: () => {
        abort()
      },
    },
  )

  return confirm
}

async function question(message: string): Promise<string> {
  const { value } = await prompts(
    {
      name: 'value',
      type: 'text',
      message,
    },
    {
      onCancel: () => {
        abort()
      },
    },
  )

  return value
}

function header(message: string, opts?: { enable?: boolean }) {
  const { enable } = opts ?? {}
  if (!enable) {
    return
  }

  console.log(chalk.bold.green(`${message}\n`))
}
