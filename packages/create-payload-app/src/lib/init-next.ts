import type { CompilerOptions } from 'typescript'

import { parse, stringify } from 'comment-json'
import execa from 'execa'
import fs from 'fs'
import globby from 'globby'
import path from 'path'
import { promisify } from 'util'

import { log } from '../utils/log.js'
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { fileURLToPath } from 'node:url'

import type { CliArgs, PackageManager } from '../types.js'

import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { error, info, debug as origDebug, success, warning } from '../utils/log.js'
import { moveMessage } from '../utils/messages.js'
import { wrapNextConfig } from './wrap-next-config.js'

type InitNextArgs = Pick<CliArgs, '--debug'> & {
  nextConfigPath: string
  packageManager: PackageManager
  projectDir: string
  useDistFiles?: boolean
}

type InitNextResult =
  | {
      isSrcDir: boolean
      nextAppDir: string
      payloadConfigPath: string
      success: true
    }
  | { isSrcDir: boolean; nextAppDir?: string; reason: string; success: false }

export async function initNext(args: InitNextArgs): Promise<InitNextResult> {
  const { packageManager, projectDir } = args

  const isSrcDir = fs.existsSync(path.resolve(projectDir, 'src'))

  // Get app directory. Could be top-level or src/app
  const nextAppDir = (
    await globby(['**/app'], {
      absolute: true,
      cwd: projectDir,
      onlyDirectories: true,
    })
  )?.[0]

  if (!nextAppDir) {
    return { isSrcDir, reason: `Could not find app directory in ${projectDir}`, success: false }
  }

  // Check for top-level layout.tsx
  const layoutPath = path.resolve(nextAppDir, 'layout.tsx')
  if (fs.existsSync(layoutPath)) {
    // Output directions for user to move all files from app to top-level directory named `(app)`
    log(moveMessage({ nextAppDir, projectDir }))
    return {
      isSrcDir,
      nextAppDir,
      reason: 'Found existing layout.tsx in app directory',
      success: false,
    }
  }

  const configurationResult = installAndConfigurePayload({
    ...args,
    isSrcDir,
    nextAppDir,
    useDistFiles: true, // Requires running 'pnpm pack-template-files' in cpa
  })

  if (configurationResult.success === false) {
    return { ...configurationResult, isSrcDir, success: false }
  }

  const { success: installSuccess } = await installDeps(projectDir, packageManager)
  if (!installSuccess) {
    return {
      ...configurationResult,
      isSrcDir,
      reason: 'Failed to install dependencies',
      success: false,
    }
  }

  // Add `@payload-config` to tsconfig.json `paths`
  await addPayloadConfigToTsConfig(projectDir, isSrcDir)

  return { ...configurationResult, isSrcDir, nextAppDir, success: true }
}

async function addPayloadConfigToTsConfig(projectDir: string, isSrcDir: boolean) {
  const tsConfigPath = path.resolve(projectDir, 'tsconfig.json')
  const userTsConfigContent = await readFile(tsConfigPath, {
    encoding: 'utf8',
  })
  const userTsConfig = parse(userTsConfigContent) as {
    compilerOptions?: CompilerOptions
  }
  if (!userTsConfig.compilerOptions && !('extends' in userTsConfig)) {
    userTsConfig.compilerOptions = {}
  }

  if (!userTsConfig.compilerOptions.paths?.['@payload-config']) {
    userTsConfig.compilerOptions.paths = {
      ...(userTsConfig.compilerOptions.paths || {}),
      '@payload-config': [`./${isSrcDir ? 'src/' : ''}payload.config.ts`],
    }
    await writeFile(tsConfigPath, stringify(userTsConfig, null, 2), { encoding: 'utf8' })
  }
}

function installAndConfigurePayload(
  args: InitNextArgs & { isSrcDir: boolean; nextAppDir: string },
):
  | { payloadConfigPath: string; success: true }
  | { payloadConfigPath?: string; reason: string; success: false } {
  const { '--debug': debug, isSrcDir, nextAppDir, nextConfigPath, projectDir, useDistFiles } = args

  info('Initializing Payload app in Next.js project', 1)

  const logDebug = (message: string) => {
    if (debug) origDebug(message)
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
      : path.resolve(dirname, '../../../../templates/blank-3.0')

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
  // const templateSrcDir = path.resolve(templateFilesPath)

  logDebug(`templateSrcDir: ${templateSrcDir}`)
  logDebug(`nextAppDir: ${nextAppDir}`)
  logDebug(`projectDir: ${projectDir}`)
  logDebug(`nextConfigPath: ${nextConfigPath}`)

  logDebug(
    `isSrcDir: ${isSrcDir}. source: ${templateSrcDir}. dest: ${path.dirname(nextConfigPath)}`,
  )

  // This is a little clunky and needs to account for isSrcDir
  copyRecursiveSync(templateSrcDir, path.dirname(nextConfigPath), debug)

  // Wrap next.config.js with withPayload
  wrapNextConfig({ nextConfigPath })

  success('Successfully initialized.')
  return {
    payloadConfigPath: path.resolve(nextAppDir, '../payload.config.ts'),
    success: true,
  }
}

async function installDeps(projectDir: string, packageManager: PackageManager) {
  info(`Installing dependencies with ${packageManager}`, 1)
  const packagesToInstall = [
    'payload',
    '@payloadcms/db-mongodb',
    '@payloadcms/next',
    '@payloadcms/richtext-lexical',
  ].map((pkg) => `${pkg}@alpha`)

  let exitCode = 0
  switch (packageManager) {
    case 'npm': {
      ;({ exitCode } = await execa('npm', ['install', '--save', ...packagesToInstall], {
        cwd: projectDir,
      }))
      break
    }
    case 'yarn':
    case 'pnpm': {
      ;({ exitCode } = await execa(packageManager, ['add', ...packagesToInstall], {
        cwd: projectDir,
      }))
      break
    }
    case 'bun': {
      warning('Bun support is untested.')
      ;({ exitCode } = await execa('bun', ['add', ...packagesToInstall], { cwd: projectDir }))
      break
    }
  }

  if (exitCode !== 0) {
    error(`Failed to install dependencies with ${packageManager}`)
  } else {
    success(`Successfully installed dependencies`)
  }
  return { success: exitCode === 0 }
}
