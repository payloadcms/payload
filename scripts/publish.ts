import fse from 'fs-extra'
import { ExecSyncOptions, execSync } from 'child_process'
import chalk from 'chalk'
import prompts from 'prompts'
import minimist from 'minimist'
import chalkTemplate from 'chalk-template'

const execOpts: ExecSyncOptions = { stdio: 'inherit' }
const args = minimist(process.argv.slice(2))

async function main() {
  const { _: packageNames, tag = 'latest', bump = 'patch' } = args

  if (packageNames.length === 0) {
    abort('Please specify a package to publish')
  }

  if (packageNames.find((p) => p === 'payload' && packageNames.length > 1)) {
    abort('Cannot publish payload with other packages')
  }

  // Get current version of each package from package.json
  const packageDetails = await Promise.all(
    packageNames.map(async (packageName) => {
      const packageDir = `packages/${packageName}`
      if (!(await fse.pathExists(packageDir))) {
        abort(`Package path ${packageDir} does not exist`)
      }
      const packageObj = await fse.readJson(`${packageDir}/package.json`)

      return { name: packageName, version: packageObj.version, dir: packageDir }
    }),
  )

  console.log(chalkTemplate`
  {bold.green Publishing packages:}

  {bold.yellow Bump: ${bump}}
  {bold.yellow Tag: ${tag}}

${packageDetails.map((p) => `  ${p.name} - current: ${p.version}`).join('\n')}
`)

  const confirmPublish = await confirm(`Publish ${packageNames.length} package(s)?`)

  if (!confirmPublish) {
    abort()
  }

  const results: { name: string; success: boolean }[] = []

  for (const pkg of packageDetails) {
    const { dir, name } = pkg

    try {
      console.log(chalk.bold(`\n\nPublishing ${name}...\n\n`))

      execSync(`npm --no-git-tag-version --prefix ${dir} version ${bump}`, execOpts)
      execSync(`git add ${dir}/package.json`, execOpts)

      const packageObj = await fse.readJson(`${dir}/package.json`)
      const newVersion = packageObj.version

      const tagName = `${name}/${newVersion}`
      execSync(`git commit -m "chore(release): ${tagName}"`, execOpts)
      execSync(`git tag -a ${tagName} -m "${tagName}"`, execOpts)
      execSync(`pnpm publish -C ${dir} --no-git-checks`, execOpts)
      results.push({ name, success: true })
    } catch (error) {
      console.error(chalk.bold.red(`ERROR: ${error.message}`))
      results.push({ name, success: false })
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
