import * as p from '@clack/prompts'
import chalk from 'chalk'
import degit from 'degit'
import execa from 'execa'
import fse from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'

import type { CliArgs, DbDetails, PackageManager, ProjectTemplate } from '../types.js'

import { debug, error, warning } from '../utils/log.js'
import { configurePayloadConfig } from './configure-payload-config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function createOrFindProjectDir(projectDir: string): Promise<void> {
  const pathExists = await fse.pathExists(projectDir)
  if (!pathExists) {
    await fse.mkdir(projectDir)
  }
}

async function installDeps(args: {
  cliArgs: CliArgs
  packageManager: PackageManager
  projectDir: string
}): Promise<boolean> {
  const { cliArgs, packageManager, projectDir } = args
  if (cliArgs['--no-deps']) {
    return true
  }
  let installCmd = 'npm install --legacy-peer-deps'

  if (packageManager === 'yarn') {
    installCmd = 'yarn'
  } else if (packageManager === 'pnpm') {
    installCmd = 'pnpm install'
  }

  try {
    await execa.command(installCmd, {
      cwd: path.resolve(projectDir),
    })
    return true
  } catch (err: unknown) {
    error(`Error installing dependencies${err instanceof Error ? `: ${err.message}` : ''}.`)
    return false
  }
}

export async function createProject(args: {
  cliArgs: CliArgs
  dbDetails?: DbDetails
  packageManager: PackageManager
  projectDir: string
  projectName: string
  template: ProjectTemplate
}): Promise<void> {
  const { cliArgs, dbDetails, packageManager, projectDir, projectName, template } = args

  if (cliArgs['--dry-run']) {
    debug(`Dry run: Creating project in ${chalk.green(projectDir)}`)
    return
  }

  await createOrFindProjectDir(projectDir)

  if (cliArgs['--local-template']) {
    // Copy template from local path. For development purposes.
    const localTemplate = path.resolve(
      dirname,
      '../../../../templates/',
      cliArgs['--local-template'],
    )
    await fse.copy(localTemplate, projectDir)
  } else if ('url' in template) {
    let templateUrl = template.url
    if (cliArgs['--template-branch']) {
      templateUrl = `${template.url}#${cliArgs['--template-branch']}`
      debug(`Using template url: ${templateUrl}`)
    }
    const emitter = degit(templateUrl)
    await emitter.clone(projectDir)
  }

  const spinner = p.spinner()
  spinner.start('Checking latest Payload version...')

  await updatePackageJSON({ projectDir, projectName })
  spinner.message('Configuring Payload...')
  await configurePayloadConfig({ dbDetails, projectDirOrConfigPath: { projectDir } })

  // Remove yarn.lock file. This is only desired in Payload Cloud.
  const lockPath = path.resolve(projectDir, 'yarn.lock')
  if (fse.existsSync(lockPath)) {
    await fse.remove(lockPath)
  }

  if (!cliArgs['--no-deps']) {
    spinner.message('Installing dependencies...')
    const result = await installDeps({ cliArgs, packageManager, projectDir })
    spinner.stop()
    if (result) {
      spinner.stop('Dependencies installed')
    } else {
      spinner.stop('Error installing dependencies', 1)
    }
  } else {
    spinner.stop('Dependency installation skipped')
  }
}

export async function updatePackageJSON(args: {
  projectDir: string
  projectName: string
}): Promise<void> {
  const { projectDir, projectName } = args
  const packageJsonPath = path.resolve(projectDir, 'package.json')
  try {
    const packageObj = await fse.readJson(packageJsonPath)
    packageObj.name = projectName
    await fse.writeJson(packageJsonPath, packageObj, { spaces: 2 })
  } catch (err: unknown) {
    warning(`Unable to update name in package.json. ${err instanceof Error ? err.message : ''}`)
  }
}
