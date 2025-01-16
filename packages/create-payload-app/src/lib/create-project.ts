import * as p from '@clack/prompts'
import chalk from 'chalk'
import execa from 'execa'
import fse from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'

import type {
  CliArgs,
  DbDetails,
  PackageManager,
  ProjectExample,
  ProjectTemplate,
} from '../types.js'

import { tryInitRepoAndCommit } from '../utils/git.js'
import { debug, error, info, warning } from '../utils/log.js'
import { configurePayloadConfig } from './configure-payload-config.js'
import { configurePluginProject } from './configure-plugin-project.js'
import { downloadExample } from './download-example.js'
import { downloadTemplate } from './download-template.js'
import { generateSecret } from './generate-secret.js'
import { manageEnvFiles } from './manage-env-files.js'

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
  } else if (packageManager === 'bun') {
    installCmd = 'bun install'
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

type TemplateOrExample =
  | {
      example: ProjectExample
    }
  | {
      template: ProjectTemplate
    }

export async function createProject(
  args: {
    cliArgs: CliArgs
    dbDetails?: DbDetails
    packageManager: PackageManager
    projectDir: string
    projectName: string
  } & TemplateOrExample,
): Promise<void> {
  const { cliArgs, dbDetails, packageManager, projectDir, projectName } = args

  if (cliArgs['--dry-run']) {
    debug(`Dry run: Creating project in ${chalk.green(projectDir)}`)
    return
  }

  await createOrFindProjectDir(projectDir)

  if (cliArgs['--local-example']) {
    // Copy example from local path. For development purposes.
    const localExample = path.resolve(dirname, '../../../../examples/', cliArgs['--local-example'])
    await fse.copy(localExample, projectDir)
  }

  if (cliArgs['--local-template']) {
    // Copy template from local path. For development purposes.
    const localTemplate = path.resolve(
      dirname,
      '../../../../templates/',
      cliArgs['--local-template'],
    )
    await fse.copy(localTemplate, projectDir)
  } else if ('template' in args && 'url' in args.template) {
    const { template } = args
    if (cliArgs['--branch']) {
      template.url = `${template.url.split('#')?.[0]}#${cliArgs['--branch']}`
    }

    await downloadTemplate({
      debug: cliArgs['--debug'],
      projectDir,
      template,
    })
  } else if ('example' in args && 'url' in args.example) {
    const { example } = args
    if (cliArgs['--branch']) {
      example.url = `${example.url.split('#')?.[0]}#${cliArgs['--branch']}`
    }

    await downloadExample({
      debug: cliArgs['--debug'],
      example,
      projectDir,
    })
  }

  const spinner = p.spinner()
  spinner.start('Checking latest Payload version...')

  await updatePackageJSON({ projectDir, projectName })

  if ('template' in args) {
    if (args.template.type === 'plugin') {
      spinner.message('Configuring Plugin...')
      configurePluginProject({ projectDirPath: projectDir, projectName })
    } else {
      spinner.message('Configuring Payload...')
      await configurePayloadConfig({
        dbType: dbDetails?.type,
        projectDirOrConfigPath: { projectDir },
      })
    }
  }

  // Call manageEnvFiles before initializing Git
  if (dbDetails) {
    await manageEnvFiles({
      cliArgs,
      databaseType: dbDetails.type,
      databaseUri: dbDetails.dbUri,
      payloadSecret: generateSecret(),
      projectDir,
      template: 'template' in args ? args.template : undefined,
    })
  }

  // Remove yarn.lock file. This is only desired in Payload Cloud.
  const lockPath = path.resolve(projectDir, 'pnpm-lock.yaml')
  if (fse.existsSync(lockPath)) {
    await fse.remove(lockPath)
  }

  if (!cliArgs['--no-deps']) {
    info(`Using ${packageManager}.\n`)
    spinner.message('Installing dependencies...')
    const result = await installDeps({ cliArgs, packageManager, projectDir })
    if (result) {
      spinner.stop('Successfully installed Payload and dependencies')
    } else {
      spinner.stop('Error installing dependencies', 1)
    }
  } else {
    spinner.stop('Dependency installation skipped')
  }

  if (!cliArgs['--no-git']) {
    tryInitRepoAndCommit({ cwd: projectDir })
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
