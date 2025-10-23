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

  // Allows overriding the installed Payload version instead of installing the latest
  const versionFromCli = cliArgs['--version']

  let payloadVersion: string

  if (versionFromCli) {
    await verifyVersionForPackage({ version: versionFromCli })

    payloadVersion = versionFromCli

    spinner.stop(`Using provided version of Payload ${payloadVersion}`)
  } else {
    payloadVersion = await getLatestPackageVersion({ packageName: 'payload' })

    spinner.stop(`Found latest version of Payload ${payloadVersion}`)
  }

  await updatePackageJSON({ latestVersion: payloadVersion, projectDir, projectName })

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

  await manageEnvFiles({
    cliArgs,
    databaseType: dbDetails?.type,
    databaseUri: dbDetails?.dbUri,
    payloadSecret: generateSecret(),
    projectDir,
    template: 'template' in args ? args.template : undefined,
  })

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

/**
 * Reads the package.json file into an object and then does the following:
 * - Sets the `name` property to the provided `projectName`.
 * - Bumps the payload packages from workspace:* to the latest version.
 * - Writes the updated object back to the package.json file.
 */
export async function updatePackageJSON(args: {
  /**
   * The latest version of Payload to use in the package.json.
   */
  latestVersion: string
  projectDir: string
  /**
   * The name of the project to set in package.json.
   */
  projectName: string
}): Promise<void> {
  const { latestVersion, projectDir, projectName } = args
  const packageJsonPath = path.resolve(projectDir, 'package.json')
  try {
    const packageObj = await fse.readJson(packageJsonPath)
    packageObj.name = projectName

    updatePackageJSONDependencies({
      latestVersion,
      packageJson: packageObj,
    })

    await fse.writeJson(packageJsonPath, packageObj, { spaces: 2 })
  } catch (err: unknown) {
    warning(`Unable to update name in package.json. ${err instanceof Error ? err.message : ''}`)
  }
}

/**
 * Recursively updates a JSON object to replace all instances of `workspace:` with the latest version pinned.
 *
 * Does not return and instead modifies the `packageJson` object in place.
 */
export function updatePackageJSONDependencies(args: {
  latestVersion: string
  packageJson: Record<string, unknown>
}): void {
  const { latestVersion, packageJson } = args

  const updatedDependencies = Object.entries(packageJson.dependencies || {}).reduce(
    (acc, [key, value]) => {
      if (typeof value === 'string' && value.startsWith('workspace:')) {
        acc[key] = `${latestVersion}`
      } else if (key === 'payload' || key.startsWith('@payloadcms')) {
        acc[key] = `${latestVersion}`
      } else {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>,
  )
  packageJson.dependencies = updatedDependencies
}

/**
 * Fetches the latest version of a package from the NPM registry.
 *
 * Used in determining the latest version of Payload to use in the generated templates.
 */
async function getLatestPackageVersion({
  packageName = 'payload',
}: {
  /**
   * Package name to fetch the latest version for based on the NPM registry URL
   *
   * Eg. for `'payload'`, it will fetch the version from `https://registry.npmjs.org/payload`
   *
   * @default 'payload'
   */
  packageName?: string
}): Promise<string> {
  try {
    const response = await fetch(`https://registry.npmjs.org/-/package/${packageName}/dist-tags`)
    const data = await response.json()

    // Monster chaining for type safety just checking for data.latest
    const latestVersion =
      data &&
      typeof data === 'object' &&
      'latest' in data &&
      data.latest &&
      typeof data.latest === 'string'
        ? data.latest
        : null

    if (!latestVersion) {
      throw new Error(`No latest version found for package: ${packageName}`)
    }

    return latestVersion
  } catch (error) {
    console.error('Error fetching Payload version:', error)
    throw error
  }
}

/**
 * Verifies that the specified version of a package exists on the NPM registry.
 *
 * Throws an error if the version does not exist.
 */
async function verifyVersionForPackage({
  packageName = 'payload',
  version,
}: {
  /**
   * Package name to fetch the latest version for based on the NPM registry URL
   *
   * Eg. for `'payload'`, it will fetch the version from `https://registry.npmjs.org/payload`
   *
   * @default 'payload'
   */
  packageName?: string
  version: string
}): Promise<void> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/${version}`)

    if (response.status !== 200) {
      throw new Error(`No ${version} version found for package: ${packageName}`)
    }
  } catch (error) {
    console.error('Error verifying Payload version:', error)
    throw error
  }
}
