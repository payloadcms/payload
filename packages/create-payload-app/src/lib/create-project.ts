import chalk from 'chalk'
import degit from 'degit'
import execa from 'execa'
import fse from 'fs-extra'
import ora from 'ora'
import path from 'path'

import type { CliArgs, DbDetails, PackageManager, ProjectTemplate } from '../types'

import { error, success, warning } from '../utils/log'
import { configurePayloadConfig } from './configure-payload-config'

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
  } else if (packageManager === 'bun') {
    installCmd = 'bun install'
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
  dbDetails?: DbDetails
  packageManager: PackageManager
  projectDir: string
  projectName: string
  template: ProjectTemplate
}): Promise<void> {
  const { cliArgs, dbDetails, packageManager, projectDir, projectName, template } = args

  await createOrFindProjectDir(projectDir)

  console.log(`\n  Creating project in ${chalk.green(path.resolve(projectDir))}\n`)

  if ('url' in template) {
    const emitter = degit(template.url)
    await emitter.clone(projectDir)
  }

  const spinner = ora('Checking latest Payload version...').start()

  await updatePackageJSON({ projectDir, projectName })
  await configurePayloadConfig({ dbDetails, projectDir })

  // Remove yarn.lock file. This is only desired in Payload Cloud.
  const lockPath = path.resolve(projectDir, 'yarn.lock')
  if (fse.existsSync(lockPath)) {
    await fse.remove(lockPath)
  }

  spinner.text = 'Installing dependencies...'
  const result = await installDeps({ cliArgs, packageManager, projectDir })
  spinner.stop()
  spinner.clear()
  if (result) {
    success('Dependencies installed')
  } else {
    error('Error installing dependencies')
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
    warning('Unable to update name in package.json')
  }
}
