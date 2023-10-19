import fse from 'fs-extra'
import { ExecSyncOptions, execSync } from 'child_process'
import chalk from 'chalk'
import prompts from 'prompts'
import minimist from 'minimist'
import chalkTemplate from 'chalk-template'
import { PackageDetails, getPackageDetails, showPackageDetails } from './lib/getPackageDetails'
import semver from 'semver'

const execOpts: ExecSyncOptions = { stdio: 'inherit' }
const args = minimist(process.argv.slice(2))

async function main() {
  const { tag = 'latest', bump = 'patch' } = args

  if (!semver.RELEASE_TYPES.includes(bump)) {
    abort(`Invalid bump type: ${bump}.\n\nMust be one of: ${semver.RELEASE_TYPES.join(', ')}`)
  }

  if (bump.startsWith('pre') && tag === 'latest') {
    abort(`Prerelease bumps must have tag: beta or canary`)
  }

  const packageDetails = await getPackageDetails()
  showPackageDetails(packageDetails)

  const { packagesToRelease } = (await prompts({
    type: 'multiselect',
    name: 'packagesToRelease',
    message: 'Select packages to release',
    instructions: 'Space to select. Enter to submit.',
    choices: packageDetails.map((p) => {
      const title = p?.newCommits ? chalk.bold.green(p?.shortName) : p?.shortName
      return {
        title,
        value: p.shortName,
      }
    }),
  })) as { packagesToRelease: string[] }

  if (!packagesToRelease) {
    abort()
  }

  if (packagesToRelease.length === 0) {
    abort('Please specify a package to publish')
  }

  if (packagesToRelease.find((p) => p === 'payload' && packagesToRelease.length > 1)) {
    abort('Cannot publish payload with other packages. Release Payload first.')
  }

  const packageMap = packageDetails.reduce(
    (acc, p) => {
      acc[p.shortName] = p
      return acc
    },
    {} as Record<string, PackageDetails>,
  )

  console.log(chalkTemplate`
  {bold.green Publishing packages:}

  {bold.yellow Bump: ${bump}}
  {bold.yellow Tag: ${tag}}

${packagesToRelease
  .map((p) => {
    const { shortName, version } = packageMap[p]
    return `  ${shortName.padEnd(24)} ${version} -> ${semver.inc(version, bump, tag)}`
  })
  .join('\n')}
`)

  const confirmPublish = await confirm(`Publish ${packagesToRelease.length} package(s)?`)

  if (!confirmPublish) {
    abort()
  }

  const results: { name: string; success: boolean }[] = []

  for (const pkg of packagesToRelease) {
    const { packagePath, shortName, name: registryName } = packageMap[pkg]

    try {
      console.log(chalk.bold(`\n\n🚀 Publishing ${shortName}...\n\n`))
      let npmVersionCmd = `npm --no-git-tag-version --prefix ${packagePath} version ${bump}`
      if (tag !== 'latest') {
        npmVersionCmd += ` --preid ${tag}`
      }
      execSync(npmVersionCmd, execOpts)

      const packageObj = await fse.readJson(`${packagePath}/package.json`)
      const newVersion = packageObj.version

      const tagName = `${shortName}/${newVersion}`
      const shouldCommit = await confirm(`🧑‍💻 Commit Release?`)
      if (shouldCommit) {
        execSync(`git add ${packagePath}/package.json`, execOpts)
        execSync(`git commit -m "chore(release): ${tagName} [skip ci]" `, execOpts)
      }

      const shouldTag = await confirm(`🏷️  Tag ${tagName}?`)
      if (shouldTag) {
        execSync(`git tag -a ${tagName} -m "${tagName}"`, execOpts)

        if (pkg === 'payload') {
          execSync(`git tag -a v${newVersion} -m "v${newVersion}"`, execOpts)
        }
      }

      let publishCmd = `pnpm publish -C ${packagePath} --no-git-checks`
      if (tag !== 'latest') {
        publishCmd += ` --tag ${tag}`
      }
      const shouldPublish = await confirm(`🚢 Publish ${registryName}${chalk.yellow('@' + tag)}?`)
      if (shouldPublish) {
        execSync(publishCmd, execOpts)
      }

      results.push({ name: shortName, success: true })
    } catch (error) {
      console.error(chalk.bold.red(`ERROR: ${error.message}`))
      results.push({ name: shortName, success: false })
    }
  }

  console.log(chalkTemplate`

  {bold.green Results:}

${results
  .map(({ name, success }) => `  ${success ? chalk.bold.green('✔') : chalk.bold.red('✘')} ${name}`)
  .join('\n')}
`)

  // Show unpushed commits and tags
  execSync(
    `git log --oneline $(git rev-parse --abbrev-ref --symbolic-full-name @{u})..HEAD`,
    execOpts,
  )

  console.log('\n')

  const push = await confirm(`Push commits and tags?`)

  if (push) {
    console.log(chalk.bold(`\n\nPushing commits and tags...\n\n`))
    execSync(`git push --follow-tags`, execOpts)
  }

  console.log(chalk.bold.green(`\n\nDone!\n\n`))
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
