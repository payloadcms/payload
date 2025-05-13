import type { CompilerOptions } from 'typescript'

import * as p from '@clack/prompts'
import { parse, stringify } from 'comment-json'
import fs from 'fs'
import fse from 'fs-extra'
import globby from 'globby'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { promisify } from 'util'

import type { CliArgs, DbType, NextAppDetails, NextConfigType, PackageManager } from '../types.js'

import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { debug as origDebug, warning } from '../utils/log.js'
import { moveMessage } from '../utils/messages.js'
import { installPackages } from './install-packages.js'
import { wrapNextConfig } from './wrap-next-config.js'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type InitNextArgs = {
  dbType: DbType
  nextAppDetails?: NextAppDetails
  packageManager: PackageManager
  projectDir: string
  useDistFiles?: boolean
} & Pick<CliArgs, '--debug'>

type InitNextResult =
  | { isSrcDir: boolean; nextAppDir?: string; reason: string; success: false }
  | {
      isSrcDir: boolean
      nextAppDir: string
      payloadConfigPath: string
      success: true
    }

export async function initNext(args: InitNextArgs): Promise<InitNextResult> {
  const { dbType: dbType, packageManager, projectDir } = args

  const nextAppDetails = args.nextAppDetails || (await getNextAppDetails(projectDir))

  if (!nextAppDetails.nextAppDir) {
    warning(`Could not find app directory in ${projectDir}, creating...`)
    const createdAppDir = path.resolve(projectDir, nextAppDetails.isSrcDir ? 'src/app' : 'app')
    fse.mkdirSync(createdAppDir, { recursive: true })
    nextAppDetails.nextAppDir = createdAppDir
  }

  const { hasTopLevelLayout, isSrcDir, nextAppDir, nextConfigType } = nextAppDetails

  if (!nextConfigType) {
    return {
      isSrcDir,
      nextAppDir,
      reason: `Could not determine Next Config type in ${projectDir}. Possibly try renaming next.config.js to next.config.cjs or next.config.mjs.`,
      success: false,
    }
  }

  if (hasTopLevelLayout) {
    // Output directions for user to move all files from app to top-level directory named `(app)`
    p.log.warn(moveMessage({ nextAppDir, projectDir }))
    return {
      isSrcDir,
      nextAppDir,
      reason: 'Found existing layout.tsx in app directory',
      success: false,
    }
  }

  const installSpinner = p.spinner()
  installSpinner.start('Installing Payload and dependencies...')

  const configurationResult = await installAndConfigurePayload({
    ...args,
    nextAppDetails,
    nextConfigType,
    useDistFiles: true, // Requires running 'pnpm pack-template-files' in cpa
  })

  if (configurationResult.success === false) {
    installSpinner.stop(configurationResult.reason, 1)
    return { ...configurationResult, isSrcDir, success: false }
  }

  const { success: installSuccess } = await installDeps(projectDir, packageManager, dbType)
  if (!installSuccess) {
    installSpinner.stop('Failed to install dependencies', 1)
    return {
      ...configurationResult,
      isSrcDir,
      reason: 'Failed to install dependencies',
      success: false,
    }
  }

  // Add `@payload-config` to tsconfig.json `paths`
  await addPayloadConfigToTsConfig(projectDir, isSrcDir)
  installSpinner.stop('Successfully installed Payload and dependencies')
  return { ...configurationResult, isSrcDir, nextAppDir, success: true }
}

async function addPayloadConfigToTsConfig(projectDir: string, isSrcDir: boolean) {
  const tsConfigPath = path.resolve(projectDir, 'tsconfig.json')

  // Check if tsconfig.json exists
  if (!fs.existsSync(tsConfigPath)) {
    warning(`Could not find tsconfig.json to add @payload-config path.`)
    return
  }
  const userTsConfigContent = await readFile(tsConfigPath, {
    encoding: 'utf8',
  })
  const userTsConfig = parse(userTsConfigContent) as {
    compilerOptions?: CompilerOptions
  }

  const hasBaseUrl =
    userTsConfig?.compilerOptions?.baseUrl && userTsConfig?.compilerOptions?.baseUrl !== '.'
  const baseUrl = hasBaseUrl ? userTsConfig?.compilerOptions?.baseUrl : './'

  if (!userTsConfig.compilerOptions && !('extends' in userTsConfig)) {
    userTsConfig.compilerOptions = {}
  }

  if (
    !userTsConfig.compilerOptions?.paths?.['@payload-config'] &&
    userTsConfig.compilerOptions?.paths
  ) {
    userTsConfig.compilerOptions.paths = {
      ...(userTsConfig.compilerOptions.paths || {}),
      '@payload-config': [`${baseUrl}${isSrcDir ? 'src/' : ''}payload.config.ts`],
    }
    await writeFile(tsConfigPath, stringify(userTsConfig, null, 2), { encoding: 'utf8' })
  }
}

async function installAndConfigurePayload(
  args: {
    nextAppDetails: NextAppDetails
    nextConfigType: NextConfigType
    useDistFiles?: boolean
  } & InitNextArgs,
): Promise<
  | { payloadConfigPath: string; success: true }
  | { payloadConfigPath?: string; reason: string; success: false }
> {
  const {
    '--debug': debug,
    nextAppDetails: { isSrcDir, nextAppDir, nextConfigPath } = {},
    nextConfigType,
    projectDir,
    useDistFiles,
  } = args

  if (!nextAppDir || !nextConfigPath) {
    return {
      reason: 'Could not find app directory or next.config.js',
      success: false,
    }
  }

  const logDebug = (message: string) => {
    if (debug) {
      origDebug(message)
    }
  }

  if (!fs.existsSync(projectDir)) {
    return {
      reason: `Could not find specified project directory at ${projectDir}`,
      success: false,
    }
  }

  const templateFilesPath =
    dirname.endsWith('dist') || useDistFiles
      ? path.resolve(dirname, '../..', 'dist/template')
      : path.resolve(dirname, '../../../../templates/blank')

  logDebug(`Using template files from: ${templateFilesPath}`)

  if (!fs.existsSync(templateFilesPath)) {
    return {
      reason: `Could not find template source files from ${templateFilesPath}`,
      success: false,
    }
  } else {
    logDebug('Found template source files')
  }

  logDebug(`Copying template files from ${templateFilesPath} to ${nextAppDir}`)

  const templateSrcDir = path.resolve(templateFilesPath, isSrcDir ? '' : 'src')

  logDebug(`templateSrcDir: ${templateSrcDir}`)
  logDebug(`nextAppDir: ${nextAppDir}`)
  logDebug(`projectDir: ${projectDir}`)
  logDebug(`nextConfigPath: ${nextConfigPath}`)
  logDebug(`payloadConfigPath: ${path.resolve(projectDir, 'payload.config.ts')}`)

  logDebug(
    `isSrcDir: ${isSrcDir}. source: ${templateSrcDir}. dest: ${path.dirname(nextConfigPath)}`,
  )

  // This is a little clunky and needs to account for isSrcDir
  copyRecursiveSync(templateSrcDir, path.dirname(nextConfigPath))

  // Wrap next.config.js with withPayload
  await wrapNextConfig({ nextConfigPath, nextConfigType })

  return {
    payloadConfigPath: path.resolve(nextAppDir, '../payload.config.ts'),
    success: true,
  }
}

async function installDeps(projectDir: string, packageManager: PackageManager, dbType: DbType) {
  const packagesToInstall = [
    'payload',
    '@payloadcms/next',
    '@payloadcms/richtext-lexical',
    '@payloadcms/payload-cloud',
  ].map((pkg) => `${pkg}@latest`)

  packagesToInstall.push(`@payloadcms/db-${dbType}@latest`)

  // Match graphql version of @payloadcms/next
  packagesToInstall.push('graphql@^16.8.1')

  return await installPackages({ packageManager, packagesToInstall, projectDir })
}

export async function getNextAppDetails(projectDir: string): Promise<NextAppDetails> {
  const isSrcDir = fs.existsSync(path.resolve(projectDir, 'src'))

  // Match next.config.js, next.config.ts, next.config.mjs, next.config.cjs
  const nextConfigPath: string | undefined = (
    await globby('next.config.(\\w)?(t|j)s', { absolute: true, cwd: projectDir })
  )?.[0]

  if (!nextConfigPath || nextConfigPath.length === 0) {
    return {
      hasTopLevelLayout: false,
      isSrcDir,
      isSupportedNextVersion: false,
      nextConfigPath: undefined,
      nextVersion: null,
    }
  }

  const packageObj = await fse.readJson(path.resolve(projectDir, 'package.json'))
  // Check if Next.js version is new enough
  let nextVersion = null
  if (packageObj.dependencies?.next) {
    nextVersion = packageObj.dependencies.next
    // Match versions using regex matching groups
    const versionMatch = /(?<major>\d+)/.exec(nextVersion)
    if (!versionMatch) {
      p.log.warn(`Could not determine Next.js version from ${nextVersion}`)
      return {
        hasTopLevelLayout: false,
        isSrcDir,
        isSupportedNextVersion: false,
        nextConfigPath,
        nextVersion,
      }
    }

    const { major } = versionMatch.groups as { major: string }
    const majorVersion = parseInt(major)
    if (majorVersion < 15) {
      return {
        hasTopLevelLayout: false,
        isSrcDir,
        isSupportedNextVersion: false,
        nextConfigPath,
        nextVersion,
      }
    }
  }

  const isSupportedNextVersion = true

  // Check if Payload already installed
  if (packageObj.dependencies?.payload) {
    return {
      hasTopLevelLayout: false,
      isPayloadInstalled: true,
      isSrcDir,
      isSupportedNextVersion,
      nextConfigPath,
      nextVersion,
    }
  }

  let nextAppDir: string | undefined = (
    await globby(['**/app'], {
      absolute: true,
      cwd: projectDir,
      ignore: ['**/node_modules/**'],
      onlyDirectories: true,
    })
  )?.[0]

  if (!nextAppDir || nextAppDir.length === 0) {
    nextAppDir = undefined
  }

  const configType = getProjectType({ nextConfigPath, packageObj })

  const hasTopLevelLayout = nextAppDir
    ? fs.existsSync(path.resolve(nextAppDir, 'layout.tsx'))
    : false

  return {
    hasTopLevelLayout,
    isSrcDir,
    isSupportedNextVersion,
    nextAppDir,
    nextConfigPath,
    nextConfigType: configType,
    nextVersion,
  }
}

function getProjectType(args: {
  nextConfigPath: string
  packageObj: Record<string, unknown>
}): NextConfigType {
  const { nextConfigPath, packageObj } = args

  if (nextConfigPath.endsWith('.ts')) {
    return 'ts'
  }

  if (nextConfigPath.endsWith('.mjs')) {
    return 'esm'
  }
  if (nextConfigPath.endsWith('.cjs')) {
    return 'cjs'
  }

  const packageJsonType = packageObj.type
  if (packageJsonType === 'module') {
    return 'esm'
  }
  if (packageJsonType === 'commonjs') {
    return 'cjs'
  }

  return 'cjs'
}
