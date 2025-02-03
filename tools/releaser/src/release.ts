/**
 * Usage: GITHUB_TOKEN=$GITHUB_TOKEN pnpm release --bump <minor|patch>
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

import type { PackageDetails } from './lib/getPackageDetails.js'

import { getPackageDetails } from './lib/getPackageDetails.js'
import { packagePublishList } from './lib/publishList.js'
import { createDraftGitHubRelease } from './utils/createDraftGitHubRelease.js'
import { generateReleaseNotes } from './utils/generateReleaseNotes.js'
import { getRecommendedBump } from './utils/getRecommendedBump.js'

// Always execute in project root
const cwd = PROJECT_ROOT
const execOpts: ExecSyncOptions = { stdio: 'inherit', cwd }
const execaOpts: execa.Options = { stdio: 'inherit', cwd }

const args = minimist(process.argv.slice(2))

const {
  bump, // Semver release type: major, minor, patch, premajor, preminor, prepatch, prerelease
  changelog = false, // Whether to update the changelog. WARNING: This gets throttled on too many commits
  'dry-run': dryRun,
  'git-commit': gitCommit = true, // Whether to run git commit operations
  'git-tag': gitTag = true, // Whether to run git tag and commit operations
  tag, // Tag to publish to: latest, beta, canary
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

  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN env var is required')
  }

  if (dryRun) {
    console.log(chalk.bold.yellow(chalk.bold.magenta('\n  👀 Dry run mode enabled')))
  }

  console.log({ args })

  const fromVersion = execSync('git describe --match "v*" --tags --abbrev=0').toString().trim()

  const config = await loadChangelogConfig(process.cwd(), {
    repo: 'payloadcms/payload',
  })

  if (!semver.RELEASE_TYPES.includes(bump)) {
    abort(`Invalid bump type: ${bump}.\n\nMust be one of: ${semver.RELEASE_TYPES.join(', ')}`)
  }

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

  if (bump.startsWith('pre') && tag === 'latest') {
    abort(`Prerelease bumps must have tag: beta or canary`)
  }

  const monorepoVersion = fse.readJSONSync(ROOT_PACKAGE_JSON)?.version

  if (!monorepoVersion) {
    throw new Error('Could not find version in package.json')
  }

  const nextReleaseVersion = semver.inc(monorepoVersion, bump, undefined, tag)

  if (!nextReleaseVersion) {
    abort(`Invalid nextReleaseVersion: ${nextReleaseVersion}`)
    return // For TS type checking
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
    openReleaseUrl: true,
    toVersion: 'HEAD',
  })

  console.log(chalk.green('\nFull Release Notes:\n\n'))
  console.log(chalk.gray(releaseNotes) + '\n\n')
  console.log(`\n\nRelease URL: ${chalk.dim(prefilledReleaseUrl)}`)

  let packageDetails = await getPackageDetails(packagePublishList)

  console.log(chalk.bold(`\n  Version: ${monorepoVersion} => ${chalk.green(nextReleaseVersion)}\n`))
  console.log(chalk.bold.yellow(`  Bump: ${bump}`))
  console.log(chalk.bold.yellow(`  Tag: ${tag}\n`))
  console.log(chalk.bold.green(`  Changes (${packageDetails.length} packages):\n`))
  console.log(
    `${packageDetails.map((p) => `  - ${p.name.padEnd(32)} ${p.version} => ${chalk.green(nextReleaseVersion)}`).join('\n')}\n`,
  )

  const confirmPublish = await confirm('Are you sure you want to create these versions?')

  if (!confirmPublish) {
    abort()
  }

  // Prebuild all packages
  header(`\n🔨 Prebuilding all packages...`)

  await execa('pnpm', ['install'], execaOpts)

  // const buildResult = await execa('pnpm', ['build:all', '--output-logs=errors-only'], execaOpts)
  const buildResult = await execa('pnpm', ['build:all'], execaOpts)
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

  // Publish only payload to get 5 min auth token
  packageDetails = packageDetails.filter((p) => p.name !== 'payload')
  runCmd(`pnpm publish -C packages/payload --no-git-checks --json --tag ${tag}`, execOpts)

  const results: PublishResult[] = []
  for (const pkg of packageDetails) {
    const res = await publishSinglePackage(pkg, { dryRun })
    results.push(res)
  }

  console.log(chalk.bold.green(`\n\nResults:\n`))

  console.log(
    results
      .map((result) => {
        if (!result.success) {
          console.error(result.details)
        }
        return `  ${result.success ? '✅' : '❌'} ${result.name}`
      })
      .join('\n') + '\n',
  )

  header(`🚀 Publishing complete!`)

  const pushTags = await confirm('Push commit and tags to remote?')
  if (pushTags) {
    runCmd(`git push --follow-tags`, execOpts)
    console.log(chalk.bold.green('Commit and tags pushed to remote'))
  }

  const createDraftRelease = await confirm('Create draft release on GitHub?')
  if (createDraftRelease) {
    try {
      const { releaseUrl: draftReleaseUrl } = await createDraftGitHubRelease({
        branch: 'main',
        releaseNotes,
        tag: `v${nextReleaseVersion}`,
      })
      console.log(chalk.bold.green(`Draft release created on GitHub: ${draftReleaseUrl}`))
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

async function publishSinglePackage(pkg: PackageDetails, opts?: { dryRun?: boolean }) {
  const { dryRun = false } = opts ?? {}
  console.log(chalk.bold(`🚀 ${pkg.name} publishing...`))

  try {
    const cmdArgs = ['publish', '-C', pkg.packagePath, '--no-git-checks', '--json', '--tag', tag]
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

function abort(message = 'Abort', exitCode = 1) {
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

type PublishResult = {
  details?: string
  name: string
  success: boolean
}
