import chalk from 'chalk'
import chalkTemplate from 'chalk-template'
import { ExecSyncOptions, execSync } from 'child_process'
import execa from 'execa'
import fse from 'fs-extra'
import minimist from 'minimist'
import path from 'path'
import prompts from 'prompts'
import semver from 'semver'
import simpleGit from 'simple-git'
import { getPackageDetails } from './lib/getPackageDetails'
import { updateChangelog } from './utils/updateChangelog'

const git = simpleGit(path.resolve(__dirname, '..'))

const execOpts: ExecSyncOptions = { stdio: 'inherit' }
const args = minimist(process.argv.slice(2))

const { tag = 'latest', bump = 'patch', 'dry-run': dryRun = true } = args

const logPrefix = dryRun ? chalk.bold.magenta('[dry-run] >') : ''

const cmdRunner = (dryRun: boolean) => (cmd: string, execOpts: ExecSyncOptions) => {
  if (dryRun) {
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
  const runCmd = cmdRunner(dryRun)
  const runCmdAsync = cmdRunnerAsync(dryRun)

  if (!semver.RELEASE_TYPES.includes(bump)) {
    abort(`Invalid bump type: ${bump}.\n\nMust be one of: ${semver.RELEASE_TYPES.join(', ')}`)
  }

  if (bump.startsWith('pre') && tag === 'latest') {
    abort(`Prerelease bumps must have tag: beta or canary`)
  }

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
  const nextReleaseVersion = semver.inc(monorepoVersion, bump, undefined, tag) as string

  const packageDetails = await getPackageDetails()

  console.log(chalkTemplate`
  {bold Version: ${monorepoVersion} => {green ${nextReleaseVersion}}}

  {bold.yellow Bump: ${bump}}
  {bold.yellow Tag: ${tag}}

  {bold.green Changes (${packageDetails.length} packages):}

${packageDetails
  .map((p) => {
    return `  - ${p.name.padEnd(32)} ${p.version} => ${chalk.green(nextReleaseVersion)}`
  })
  .join('\n')}
`)

  const confirmPublish = await confirm('Are you sure your want to create these versions?')

  if (!confirmPublish) {
    abort()
  }

  // Prebuild all packages
  header(`\n🔨 Prebuilding all packages...`)
  runCmd('pnpm build:all --output-logs=errors-only', execOpts)

  // Update changelog

  header(`${logPrefix}📝 Updating changelog...`)
  await updateChangelog({ newVersion: nextReleaseVersion, dryRun })

  // Increment all package versions
  header(`${logPrefix}📦 Updating package.json versions...`)
  await Promise.all(
    packageDetails.map(async (pkg) => {
      const packageJson = await fse.readJSON(`${pkg.packagePath}/package.json`)
      packageJson.version = nextReleaseVersion
      if (!dryRun) {
        await fse.writeJSON(`${pkg.packagePath}/package.json`, packageJson, { spaces: 2 })
      }
    }),
  )

  // Set version in root package.json
  header(`${logPrefix}📦 Updating root package.json...`)
  const rootPackageJsonPath = path.resolve(__dirname, '../package.json')
  const rootPackageJson = await fse.readJSON(rootPackageJsonPath)
  rootPackageJson.version = nextReleaseVersion
  if (!dryRun) {
    await fse.writeJSON(rootPackageJsonPath, rootPackageJson, { spaces: 2 })
  }

  // Commit
  header(`🧑‍💻 Committing changes...`)

  // Commit all staged changes
  runCmd(`git add CHANGELOG.md packages package.json`, execOpts)
  runCmd(`git commit -m "chore(release): v${nextReleaseVersion} [skip ci]"`, execOpts)

  // Tag
  header(`🏷️  Tagging release v${nextReleaseVersion}`)
  runCmd(`git tag -a v${nextReleaseVersion} -m "v${nextReleaseVersion}"`, execOpts)

  // Publish
  const results: { name: string; success: boolean }[] = await Promise.all(
    packageDetails.map(async (pkg) => {
      try {
        console.log(logPrefix, chalk.bold(`🚀 ${pkg.name} publishing...`))
        const cmdArgs = [
          'publish',
          '-C',
          pkg.packagePath,
          '--no-git-checks',
          '--tag',
          tag,
          '--dry-run',
        ] // TODO: remove this
        // if (dryRun) cmdArgs.push('--dry-run')
        const { exitCode } = await execa('pnpm', cmdArgs, {
          cwd: path.resolve(__dirname, '..'),
          stdio: ['ignore', 'ignore', 'pipe'],
          // stdio: 'inherit',
        })
        if (exitCode !== 0) {
          console.log(chalk.bold.red(`\n\np❌ ${pkg.name} ERROR: pnpm publish failed\n\n`))
          return { name: pkg.name, success: false }
        }

        console.log(chalk.green(`✅ ${pkg.name} published`))
        return { name: pkg.name, success: true }
      } catch (error) {
        console.error(chalk.bold.red(`\n\np❌ ${pkg.name} ERROR: ${error.message}\n\n`))
        return { name: pkg.name, success: false }
      }
    }),
  )

  console.log(chalkTemplate`

  {bold.green Results:}

${results
  .map(
    ({ name, success }) => `  ${success ? chalk.bold.green('✅') : chalk.bold.red('❌')} ${name}`,
  )
  .join('\n')}
`)

  // TODO: Push commit and tag
  // const push = await confirm(`Push commits and tags?`)
  // if (push) {
  //   header(`Pushing commits and tags...`)
  //   execSync(`git push --follow-tags`, execOpts)
  // }

  header('🎉 Done!')
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

async function header(message: string) {
  console.log(chalk.bold.green(`${message}\n`))
}
