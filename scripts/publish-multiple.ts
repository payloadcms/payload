import fse from 'fs-extra'
import { ExecSyncOptions, execSync } from 'child_process'
import chalk from 'chalk'
import prompts from 'prompts'
import minimist from 'minimist'

const execOpts: ExecSyncOptions = { stdio: 'inherit' }

async function main() {
  const args = minimist(process.argv.slice(2))
  const { _: packageNames } = args

  // If packageNames contains a comma, parse
  if (packageNames[0]?.includes(',')) {
    packageNames.length = 0
    const splitNames = process.argv[2].split(',')
    packageNames.push(...splitNames)
  }

  if (packageNames.length === 0) {
    console.error('Please specify a package to publish')
    process.exit(1)
  }

  console.log(`\n${chalk.bold.green('Publishing packages:')}\n`)
  console.log(`${packageNames.map((p) => `  ${p}`).join('\n')}`)
  console.log('\n')

  const { confirm } = await prompts(
    {
      name: 'confirm',
      initial: false,
      message: `Publish ${packageNames.length} package(s)?`,
      type: 'confirm',
    },
    {
      onCancel: () => {
        console.log(chalk.bold.red('\nAborted'))
        process.exit(0)
      },
    },
  )

  if (!confirm) {
    console.log(chalk.bold.red('\nAborted\n'))
    process.exit(0)
  }

  const results: { name: string; success: boolean }[] = []

  for (const packageName of packageNames) {
    const packageDir = `packages/${packageName}`
    try {
      console.log(chalk.bold(`Publishing ${packageName}...`))
      execSync(`npm --prefix ${packageDir} version pre --preid beta`, execOpts)
      execSync(`git add ${packageDir}/package.json`, execOpts)

      const packageObj = await fse.readJson(`${packageDir}/package.json`)
      const newVersion = packageObj.version

      execSync(`git commit -m "chore(release): ${packageName}@${newVersion}"`, execOpts)
      execSync(`pnpm publish -C ${packageDir} --tag beta --no-git-checks`, execOpts)
      results.push({ name: packageName, success: true })
    } catch (error) {
      console.error(`ERROR: ${error.message}`)
      results.push({ name: packageName, success: false })
    }
  }

  console.log('\n')
  console.log(`${chalk.bold('Results:')}\n`)
  console.log(
    results
      .map(
        ({ name, success }) =>
          `  ${success ? chalk.bold.green('✔') : chalk.bold.red('✘')} ${name}`,
      )
      .join('\n'),
  )
  console.log('\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
