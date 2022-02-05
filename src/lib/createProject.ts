import path from 'path'
import chalk from 'chalk'
import fse from 'fs-extra'
import execa from 'execa'
import ora from 'ora'
import degit from 'degit'

import { success, error, warning } from '../utils/log'
import { setTags } from '../utils/usage'
import type { CliArgs, ProjectTemplate } from '../types'

async function createProjectDir(projectDir: string): Promise<void> {
  const pathExists = await fse.pathExists(projectDir)
  if (pathExists) {
    error(`The project directory '${projectDir}' already exists`)
    process.exit(1)
  }
  await fse.mkdir(projectDir)
}

async function installDeps(
  args: CliArgs,
  dir: string,
  packageManager: string,
): Promise<boolean> {
  if (args['--no-deps']) {
    return true
  }
  const cmd = packageManager === 'yarn' ? 'yarn' : 'npm install --legacy-peer-deps'

  try {
    await execa.command(cmd, {
      cwd: path.resolve(dir),
    })
    return true
  } catch (error: unknown) {
    return false
  }
}

export async function getLatestPayloadVersion(
  betaFlag = false,
): Promise<false | string> {
  try {
    let packageWithTag = 'payload'
    if (betaFlag) packageWithTag += '@beta'
    const { stdout } = await execa(`npm info ${packageWithTag} version`, [], {
      shell: true,
    })
    return `^${stdout}`
  } catch (error: unknown) {
    return false
  }
}

export async function updatePayloadVersion(
  projectDir: string,
  betaFlag = false,
): Promise<void> {
  const payloadVersion = await getLatestPayloadVersion(betaFlag)
  if (!payloadVersion) {
    warning(
      'Error retrieving latest Payload version. Please update your package.json manually.',
    )
    return
  }
  setTags({ payload_version: payloadVersion })

  const packageJsonPath = path.resolve(projectDir, 'package.json')
  try {
    const packageObj = await fse.readJson(packageJsonPath)
    packageObj.dependencies.payload = payloadVersion
    await fse.writeJson(packageJsonPath, packageObj, { spaces: 2 })
  } catch (err) {
    warning(
      'Unable to write Payload version to package.json. Please update your package.json manually.',
    )
  }
}

export async function createProject(
  args: CliArgs,
  projectDir: string,
  template: ProjectTemplate,
  packageManager: string,
): Promise<void> {
  await createProjectDir(projectDir)
  const templateDir = path.resolve(__dirname, `../templates/${template.name}`)

  console.log(
    `\n  Creating a new Payload app in ${chalk.green(path.resolve(projectDir))}\n`,
  )

  if (template.type === 'starter') {
    const emitter = degit(template.url)
    await emitter.clone(projectDir)
  } else {
    try {
      await fse.copy(templateDir, projectDir, { recursive: true })
      success('Project directory created')
    } catch (err) {
      const msg =
        'Unable to copy template files. Please check template name or directory permissions.'
      error(msg)
      process.exit(1)
    }
  }

  const spinner = ora('Checking latest Payload version...').start()
  await updatePayloadVersion(projectDir, args['--beta'])

  spinner.text = 'Installing dependencies...'
  const result = await installDeps(args, projectDir, packageManager)
  spinner.stop()
  spinner.clear()
  if (result) {
    success('Dependencies installed')
  } else {
    error('Error installing dependencies')
  }
}
