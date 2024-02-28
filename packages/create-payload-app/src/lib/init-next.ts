import fs from 'fs'
import globby from 'globby'
import path from 'path'

import type { CliArgs } from '../types'

import { copyRecursiveSync } from '../utils/copy-recursive-sync'

export async function initNext(args: CliArgs): Promise<void> {
  const { '--debug': debug } = args
  const projectDir = process.cwd()

  const foundConfig = (await globby('next.config.*js', { cwd: process.cwd() }))?.[0]
  const nextConfigPath = path.resolve(projectDir, foundConfig)
  if (!fs.existsSync(nextConfigPath)) {
    console.log(
      `No next.config.js found at ${nextConfigPath}. Ensure you are in a Next.js project directory.`,
    )
    process.exit(1)
  } else {
    if (debug) console.log(`Found Next config at ${nextConfigPath}`)
  }

  const templateFilesPath = __dirname.endsWith('dist')
    ? path.resolve(__dirname, '../..', 'dist/app')
    : path.resolve(__dirname, '../../../next/src/app')

  console.log(`Using template files from: ${templateFilesPath}`)

  if (!fs.existsSync(templateFilesPath)) {
    console.log(`Could not find template source files from ${templateFilesPath}`)
    process.exit(1)
  } else {
    console.log('Found template source files')
  }

  const userAppDir = path.resolve(projectDir, 'src/app')
  if (!fs.existsSync(userAppDir)) {
    console.log(`Could not find user app directory at ${userAppDir}`)
    process.exit(1)
  } else {
    if (debug) console.log(`Found user app directory: ${userAppDir}`)
  }

  copyRecursiveSync(templateFilesPath, userAppDir, debug)
  process.exit(0)
}
