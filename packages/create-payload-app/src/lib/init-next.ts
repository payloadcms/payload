import fs from 'fs'
import globby from 'globby'
import path from 'path'

import type { CliArgs } from '../types'

import { copyRecursiveSync } from '../utils/copy-recursive-sync'
import { error, info, debug as origDebug, success } from '../utils/log'

export async function initNext(
  args: Pick<CliArgs, '--debug'> & { nextDir?: string; useDistFiles?: boolean },
): Promise<{ success: boolean }> {
  const { '--debug': debug, nextDir, useDistFiles } = args

  info('Initializing Payload app in Next.js project', 1)

  const logDebug = (message: string) => {
    if (debug) origDebug(message)
  }

  let projectDir = process.cwd()
  if (nextDir) {
    projectDir = path.resolve(projectDir, nextDir)
    if (debug) logDebug(`Overriding project directory to ${projectDir}`)
  }

  if (!fs.existsSync(projectDir)) {
    error(`Could not find specified project directory at ${projectDir}`)
    return { success: false }
  }

  const foundConfig = (await globby('next.config.*js', { cwd: projectDir }))?.[0]
  const nextConfigPath = path.resolve(projectDir, foundConfig)
  if (!fs.existsSync(nextConfigPath)) {
    error(
      `No next.config.js found at ${nextConfigPath}. Ensure you are in a Next.js project directory.`,
    )
    return { success: false }
  } else {
    if (debug) logDebug(`Found Next config at ${nextConfigPath}`)
  }

  const templateFilesPath =
    __dirname.endsWith('dist') || useDistFiles
      ? path.resolve(__dirname, '../..', 'dist/app')
      : path.resolve(__dirname, '../../../next/src/app')

  if (debug) logDebug(`Using template files from: ${templateFilesPath}`)

  if (!fs.existsSync(templateFilesPath)) {
    error(`Could not find template source files from ${templateFilesPath}`)
    return { success: false }
  } else {
    if (debug) logDebug('Found template source files')
  }

  const userAppDir = path.resolve(projectDir, 'src/app')
  if (!fs.existsSync(userAppDir)) {
    error(`Could not find user app directory at ${userAppDir}`)
    return { success: false }
  } else {
    logDebug(`Found user app directory: ${userAppDir}`)
  }

  logDebug(`Copying template files from ${templateFilesPath} to ${userAppDir}`)
  copyRecursiveSync(templateFilesPath, userAppDir, debug)
  success('Successfully initialized.')
  return { success: true }
}
