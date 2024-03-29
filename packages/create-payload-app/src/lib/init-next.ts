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
      nextAppDir: string
      payloadConfigPath: string
      success: true
    }
  | { reason: string; success: false }

export async function initNext(args: InitNextArgs): Promise<InitNextResult> {
  const { packageManager, projectDir } = args

  // Get app directory. Could be top-level or src/app
  const nextAppDir = (
    await globby(['**/app'], {
      absolute: true,
      cwd: projectDir,
      onlyDirectories: true,
    })
  )?.[0]

  if (!nextAppDir) {
    return { reason: `Could not find app directory in ${projectDir}`, success: false }
  }

  // Check for top-level layout.tsx
  const layoutPath = path.resolve(nextAppDir, 'layout.tsx')
  if (fs.existsSync(layoutPath)) {
    // Output directions for user to move all files from app to top-level directory named `(app)`
    log(moveMessage({ nextAppDir, projectDir }))
    return { reason: 'Found existing layout.tsx in app directory', success: false }
  }

  const configurationResult = installAndConfigurePayload({
    ...args,
    nextAppDir,
    useDistFiles: true, // Requires running 'pnpm pack-template-files' in cpa
  })

  if (!configurationResult.success) return configurationResult

  const { success: installSuccess } = await installDeps(projectDir, packageManager)
  if (!installSuccess) {
    return { ...configurationResult, reason: 'Failed to install dependencies', success: false }
  }

  // Add `@payload-config` to tsconfig.json `paths`
  await addPayloadConfigToTsConfig(projectDir)

  return configurationResult
}

async function addPayloadConfigToTsConfig(projectDir: string) {
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
      '@payload-config': ['./src/payload.config.ts'], // TODO: Account for srcDir
    }
    await writeFile(tsConfigPath, stringify(userTsConfig, null, 2), { encoding: 'utf8' })
  }
}

function installAndConfigurePayload(args: InitNextArgs & { nextAppDir: string }): InitNextResult {
  const { '--debug': debug, nextAppDir, nextConfigPath, projectDir, useDistFiles } = args

  info('Initializing Payload app in Next.js project', 1)

  const logDebug = (message: string) => {
    if (debug) origDebug(message)
  }

  if (!fs.existsSync(projectDir)) {
    return { reason: `Could not find specified project directory at ${projectDir}`, success: false }
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

  // TODO: Account for isSrcDir or not. Assuming src exists right now.
  const templateSrcDir = path.resolve(templateFilesPath, 'src')

  // This is a little clunky and needs to account for isSrcDir
  copyRecursiveSync(templateSrcDir, path.dirname(nextAppDir), debug)

  // Wrap next.config.js with withPayload
  wrapNextConfig({ nextConfigPath })

  success('Successfully initialized.')
  return {
    nextAppDir,
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
