import path from 'path'
import chalk from 'chalk'
import fse from 'fs-extra'
import execa from 'execa'
import ora from 'ora'
import degit from 'degit'

import { success, error, warning } from '../utils/log'
import type { CliArgs, DbDetails, PackageManager, ProjectTemplate } from '../types'
import { configurePayloadConfig } from './configure-payload-config'

async function createOrFindProjectDir(projectDir: string): Promise<void> {
  const pathExists = await fse.pathExists(projectDir)
  if (!pathExists) {
    await fse.mkdir(projectDir)
  }
}

async function installDeps(args: {
  cliArgs: CliArgs
  projectDir: string
  packageManager: PackageManager
}): Promise<boolean> {
  const { cliArgs, projectDir, packageManager } = args
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
    console.log({ err })
    return false
  }
}

export async function createProject(args: {
  cliArgs: CliArgs
  projectName: string
  projectDir: string
  template: ProjectTemplate
  packageManager: PackageManager
  dbDetails?: DbDetails
}): Promise<void> {
  const { cliArgs, projectName, projectDir, template, packageManager, dbDetails } =
    args

  await createOrFindProjectDir(projectDir)

  console.log(`\n  Creating project in ${chalk.green(path.resolve(projectDir))}\n`)

  if ('url' in template) {
    const emitter = degit(template.url)
    await emitter.clone(projectDir)
  }

  const spinner = ora('Checking latest Payload version...').start()

  await updatePackageJSON({ projectName, projectDir })
  await configurePayloadConfig({ projectDir, dbDetails })

  // Remove yarn.lock file. This is only desired in Payload Cloud.
  const lockPath = path.resolve(projectDir, 'yarn.lock')
  if (fse.existsSync(lockPath)) {
    await fse.remove(lockPath)
  }

  spinner.text = 'Installing dependencies...'
  const result = await installDeps({ cliArgs, projectDir, packageManager })
  spinner.stop()
  spinner.clear()
  if (result) {
    success('Dependencies installed')
  } else {
    error('Error installing dependencies')
  }
}

export async function updatePackageJSON(args: {
  projectName: string
  projectDir: string
}): Promise<void> {
  const { projectName, projectDir } = args
  const packageJsonPath = path.resolve(projectDir, 'package.json')
  try {
    const packageObj = await fse.readJson(packageJsonPath)
    packageObj.name = projectName
    await fse.writeJson(packageJsonPath, packageObj, { spaces: 2 })
  } catch (err: unknown) {
    warning('Unable to update name in package.json')
  }
}
