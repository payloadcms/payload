import fs from 'fs'
import globby from 'globby'
import path from 'path'

import type { CliArgs } from '../types'

import { copyRecursiveSync } from '../utils/copy-recursive-sync'

export async function initNext(
  args: Pick<CliArgs, '--debug'> & { nextDir?: string; useDistFiles?: boolean },
): Promise<{ success: boolean }> {
  const { '--debug': debug, nextDir, useDistFiles } = args
  let projectDir = process.cwd()
  if (nextDir) {
    projectDir = path.resolve(projectDir, nextDir)
    console.log(`Overriding project directory to ${projectDir}`)
  }

  if (!fs.existsSync(projectDir)) {
    console.log(`Could not find specified project directory at ${projectDir}`)
    return { success: false }
  }

  const foundConfig = (await globby('next.config.*js', { cwd: projectDir }))?.[0]
  const nextConfigPath = path.resolve(projectDir, foundConfig)
  if (!fs.existsSync(nextConfigPath)) {
    console.log(
      `No next.config.js found at ${nextConfigPath}. Ensure you are in a Next.js project directory.`,
    )
    return { success: false }
  } else {
    if (debug) console.log(`Found Next config at ${nextConfigPath}`)
  }

  const templateFilesPath =
    __dirname.endsWith('dist') || useDistFiles
      ? path.resolve(__dirname, '../..', 'dist/app')
      : path.resolve(__dirname, '../../../next/src/app')

  console.log(`Using template files from: ${templateFilesPath}`)

  if (!fs.existsSync(templateFilesPath)) {
    console.log(`Could not find template source files from ${templateFilesPath}`)
    return { success: false }
  } else {
    console.log('Found template source files')
  }

  const userAppDir = path.resolve(projectDir, 'src/app')
  if (!fs.existsSync(userAppDir)) {
    console.log(`Could not find user app directory at ${userAppDir}`)
    return { success: false }
  } else {
    if (debug) console.log(`Found user app directory: ${userAppDir}`)
  }

  copyRecursiveSync(templateFilesPath, userAppDir, debug)
  return { success: true }
}
