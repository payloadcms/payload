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
import {
  DEFAULT_PAYLOAD_VERSION_TAG,
  resolvePackageVersion,
} from '../utils/resolvePackageVersion.js'
import { buildAgentConfigFiles } from './agent-config.js'
import { configurePayloadConfig } from './configure-payload-config.js'
import { configurePluginProject } from './configure-plugin-project.js'
import { ensurePnpmBuildApprovals } from './configure-pnpm-builds.js'
import { downloadExample } from './download-example.js'
import { downloadTemplate } from './download-template.js'
import { generateSecret } from './generate-secret.js'
import { getInstallCommand, getRunCommand } from './get-package-manager.js'
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
  const installCmd = getInstallCommand(packageManager)

  await ensurePnpmBuildApprovals({ packageManager, projectDir })

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

type PayloadGenerateResult = { error: string; ok: false } | { ok: true }

async function runPayloadCommand(args: {
  command: string
  packageManager: PackageManager
  projectDir: string
}): Promise<PayloadGenerateResult> {
  const { command, packageManager, projectDir } = args

  try {
    await execa.command(`${getRunCommand(packageManager)} ${command}`, {
      cwd: path.resolve(projectDir),
    })
    return { ok: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err), ok: false }
  }
}

/** Non-fatal: on failure, warn with the command to run later. */
async function runPayloadGenerate(args: {
  artifact: string
  command: string
  packageManager: PackageManager
  projectDir: string
  spinner: ReturnType<typeof p.spinner>
}): Promise<void> {
  const { artifact, command, packageManager, projectDir, spinner } = args

  spinner.start(`Generating ${artifact}...`)
  const result = await runPayloadCommand({ command, packageManager, projectDir })
  const capitalized = artifact.charAt(0).toUpperCase() + artifact.slice(1)

  if (result.ok) {
    spinner.stop(`${capitalized} generated`)
    return
  }

  spinner.stop(`Could not generate ${artifact}`, 1)
  warning(`Run '${getRunCommand(packageManager)} ${command}' later. ${result.error}`)
}

async function runProjectCodegen(args: {
  packageManager: PackageManager
  projectDir: string
  spinner: ReturnType<typeof p.spinner>
}): Promise<void> {
  await runPayloadGenerate({
    ...args,
    artifact: 'import map',
    command: 'generate:importmap',
  })
  await runPayloadGenerate({
    ...args,
    artifact: 'types',
    command: 'generate:types',
  })
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

  const versionOrTag = cliArgs['--payload-version'] ?? DEFAULT_PAYLOAD_VERSION_TAG

  const spinner = p.spinner()
  spinner.start(`Resolving Payload version (${versionOrTag})...`)

  const payloadVersion = await resolvePackageVersion({
    packageName: 'payload',
    versionOrTag,
  })

  spinner.stop(`Using Payload version ${payloadVersion}`)

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

  if (!cliArgs['--no-agent']) {
    for (const { content, fileName } of buildAgentConfigFiles()) {
      await fse.writeFile(path.resolve(projectDir, fileName), content)
    }
  }

  if (!cliArgs['--no-deps']) {
    info(`Using ${packageManager}.\n`)
    spinner.message('Installing dependencies...')
    const result = await installDeps({ cliArgs, packageManager, projectDir })
    if (result) {
      spinner.stop('Successfully installed Payload and dependencies')

      await runProjectCodegen({ packageManager, projectDir, spinner })
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
 * Packages that are only published on the v4 line, so a v3 version of them does not exist.
 * `@payloadcms/transformer-sharp` is a v4-only package (#18988); `@payloadcms/tanstack-start`
 * follows the same rule.
 */
const V4_ONLY_PACKAGES = ['@payloadcms/tanstack-start', '@payloadcms/transformer-sharp']

/**
 * Packages published outside the monorepo release line, which must keep their own version.
 * Mirrors the `DO_NOT_BUMP` list in `tools/scripts/src/generate-template-variations.ts`.
 */
const DO_NOT_BUMP = ['@payloadcms/eslint-config', '@payloadcms/eslint-plugin']

function isPayloadPackage(packageName: string): boolean {
  return packageName === 'payload' || packageName.startsWith('@payloadcms')
}

/**
 * Updates a JSON object in place so every Payload package follows the latest version:
 * - `workspace:` entries in `dependencies` and `devDependencies` become the pinned version.
 * - `payload` and `@payloadcms/*` entries in `dependencies` and `devDependencies` become the pinned version.
 * - `payload` and `@payloadcms/*` entries in `peerDependencies` get a caret range on the pinned version.
 *
 * Templates pin Payload in either dependency group (the `plugin` starter pins it in `devDependencies`),
 * so both groups must be rewritten for the scaffolded project to follow the resolved version.
 *
 * Does not return and instead modifies the `packageJson` object in place.
 */
export function updatePackageJSONDependencies(args: {
  latestVersion: string
  packageJson: Record<string, unknown>
}): void {
  const { latestVersion, packageJson } = args
  const resolvedMajor = latestVersion.split('.')[0]

  // A v4-only package has no v3 release to pin to when a v3 version is resolved, for example when a
  // v4 template is scaffolded with `--branch main` on a stable CLI. Keep the template's own pin
  // instead of pointing at a version that was never published.
  const isV4OnlyOffLine = (packageName: string): boolean =>
    V4_ONLY_PACKAGES.includes(packageName) && resolvedMajor !== '4'

  const pinVersion = (packageName: string, value: unknown): unknown => {
    // A `workspace:` placeholder is always replaced, whatever the package: leaving it in the
    // scaffolded package.json makes the install fail with `EUNSUPPORTEDPROTOCOL` (the `blank`,
    // `website` and `blank-tanstack` starters carry v4-only packages as `workspace:*`).
    if (typeof value === 'string' && value.startsWith('workspace:')) {
      return latestVersion
    }
    if (
      isPayloadPackage(packageName) &&
      !DO_NOT_BUMP.includes(packageName) &&
      !isV4OnlyOffLine(packageName)
    ) {
      return latestVersion
    }
    return value
  }

  for (const field of ['dependencies', 'devDependencies'] as const) {
    const dependencies = packageJson[field]
    if (!dependencies || typeof dependencies !== 'object') {
      continue
    }

    packageJson[field] = Object.entries(dependencies as Record<string, unknown>).reduce(
      (acc, [key, value]) => {
        acc[key] = pinVersion(key, value)
        return acc
      },
      {} as Record<string, unknown>,
    )
  }

  const peerDependencies = packageJson.peerDependencies
  if (peerDependencies && typeof peerDependencies === 'object') {
    packageJson.peerDependencies = Object.entries(
      peerDependencies as Record<string, unknown>,
    ).reduce(
      (acc, [key, value]) => {
        acc[key] =
          isPayloadPackage(key) && !DO_NOT_BUMP.includes(key) && !isV4OnlyOffLine(key)
            ? `^${latestVersion}`
            : value
        return acc
      },
      {} as Record<string, unknown>,
    )
  }
}
