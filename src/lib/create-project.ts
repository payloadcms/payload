import path from 'path'
import chalk from 'chalk'
import fse from 'fs-extra'
import execa from 'execa'
import ora from 'ora'
import degit from 'degit'

import { success, error, warning } from '../utils/log'
import type { CliArgs, ProjectTemplate } from '../types'

async function createOrFindProjectDir(projectDir: string): Promise<void> {
  const pathExists = await fse.pathExists(projectDir)
  if (!pathExists) {
    await fse.mkdir(projectDir)
  }
}

async function installDeps(args: {
  cliArgs: CliArgs
  projectDir: string
  packageManager: string
}): Promise<boolean> {
  const { cliArgs, projectDir, packageManager } = args
  if (cliArgs['--no-deps']) {
    return true
  }
  const cmd = packageManager === 'yarn' ? 'yarn' : 'npm install --legacy-peer-deps'

  try {
    await execa.command(cmd, {
      cwd: path.resolve(projectDir),
    })
    return true
  } catch (err: unknown) {
    console.log({ err })
    return false
  }
}

export async function updatePackageJSONName(args: {
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

export async function createProject(args: {
  cliArgs: CliArgs
  projectName: string
  projectDir: string
  template: ProjectTemplate
  packageManager: string
}): Promise<void> {
  const { cliArgs, projectName, projectDir, template, packageManager } = args

  await createOrFindProjectDir(projectDir)

  console.log(`\n  Creating project in ${chalk.green(path.resolve(projectDir))}\n`)

  if ('url' in template) {
    const emitter = degit(template.url)
    await emitter.clone(projectDir)
  }

  const spinner = ora('Checking latest Payload version...').start()

  await updatePackageJSONName({ projectName, projectDir })

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
