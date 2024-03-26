import type { CompilerOptions } from 'typescript'

import chalk from 'chalk'
import { parse, stringify } from 'comment-json'
import { detect } from 'detect-package-manager'
import execa from 'execa'
import fs from 'fs'
import fse from 'fs-extra'
import globby from 'globby'
import path from 'path'
import { promisify } from 'util'
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { fileURLToPath } from 'node:url'

import type { CliArgs } from '../types.js'

import { copyRecursiveSync } from '../utils/copy-recursive-sync.js'
import { error, info, debug as origDebug, success, warning } from '../utils/log.js'

type InitNextArgs = Pick<CliArgs, '--debug'> & {
  projectDir?: string
  useDistFiles?: boolean
}
type InitNextResult = { reason?: string; success: boolean; userAppDir?: string }

export async function initNext(args: InitNextArgs): Promise<InitNextResult> {
  args.projectDir = args.projectDir || process.cwd()
  const { projectDir } = args
  const templateResult = await applyPayloadTemplateFiles(args)
  if (!templateResult.success) return templateResult

  const { success: installSuccess } = await installDeps(projectDir)
  if (!installSuccess) {
    return { ...templateResult, reason: 'Failed to install dependencies', success: false }
  }

  // Create or find payload.config.ts
  const createConfigResult = findOrCreatePayloadConfig(projectDir)
  if (!createConfigResult.success) {
    return { ...templateResult, ...createConfigResult }
  }

  // Add `@payload-config` to tsconfig.json `paths`
  await addPayloadConfigToTsConfig(projectDir)

  // Output directions for user to update next.config.js
  const withPayloadMessage = `

  ${chalk.bold(`Wrap your existing next.config.js with the withPayload function. Here is an example:`)}

  import withPayload from '@payloadcms/next/withPayload'

  const nextConfig = {
    // Your Next.js config here
  }

  export default withPayload(nextConfig)

`

  console.log(withPayloadMessage)

  return templateResult
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
      '@payload-config': ['./payload.config.ts'],
    }
    await writeFile(tsConfigPath, stringify(userTsConfig, null, 2), { encoding: 'utf8' })
  }
}

async function applyPayloadTemplateFiles(args: InitNextArgs): Promise<InitNextResult> {
  const { '--debug': debug, projectDir, useDistFiles } = args

  info('Initializing Payload app in Next.js project', 1)

  const logDebug = (message: string) => {
    if (debug) origDebug(message)
  }

  if (!fs.existsSync(projectDir)) {
    return { reason: `Could not find specified project directory at ${projectDir}`, success: false }
  }

  // Next.js configs can be next.config.js, next.config.mjs, etc.
  const foundConfig = (await globby('next.config.*js', { cwd: projectDir }))?.[0]

  if (!foundConfig) {
    throw new Error(`No next.config.js found at ${projectDir}`)
  }

  const nextConfigPath = path.resolve(projectDir, foundConfig)
  if (!fs.existsSync(nextConfigPath)) {
    return {
      reason: `No next.config.js found at ${nextConfigPath}. Ensure you are in a Next.js project directory.`,
      success: false,
    }
  } else {
    if (debug) logDebug(`Found Next config at ${nextConfigPath}`)
  }

  const templateFilesPath =
    dirname.endsWith('dist') || useDistFiles
      ? path.resolve(dirname, '../..', 'dist/app')
      : path.resolve(dirname, '../../../../app')

  if (debug) logDebug(`Using template files from: ${templateFilesPath}`)

  if (!fs.existsSync(templateFilesPath)) {
    return {
      reason: `Could not find template source files from ${templateFilesPath}`,
      success: false,
    }
  } else {
    if (debug) logDebug('Found template source files')
  }

  // src/app or app
  const userAppDirGlob = await globby(['**/app'], {
    cwd: projectDir,
    onlyDirectories: true,
  })
  const userAppDir = path.resolve(projectDir, userAppDirGlob?.[0])
  if (!fs.existsSync(userAppDir)) {
    return { reason: `Could not find user app directory inside ${projectDir}`, success: false }
  } else {
    logDebug(`Found user app directory: ${userAppDir}`)
  }

  logDebug(`Copying template files from ${templateFilesPath} to ${userAppDir}`)
  copyRecursiveSync(templateFilesPath, userAppDir, debug)
  success('Successfully initialized.')
  return { success: true, userAppDir }
}

async function installDeps(projectDir: string) {
  const packageManager = await detect({ cwd: projectDir })
  if (!packageManager) {
    throw new Error('Could not detect package manager')
  }

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
function findOrCreatePayloadConfig(projectDir: string) {
  const configPath = path.resolve(projectDir, 'payload.config.ts')
  if (fs.existsSync(configPath)) {
    return { message: 'Found existing payload.config.ts', success: true }
  } else {
    // Create default config
    // TODO: Pull this from templates
    const defaultConfig = `import path from "path";

import { mongooseAdapter } from "@payloadcms/db-mongodb"; // database-adapter-import
import { lexicalEditor } from "@payloadcms/richtext-lexical"; // editor-import
import { buildConfig } from "payload/config";

export default buildConfig({
  editor: slateEditor({}), // editor-config
  collections: [],
  secret: "asdfasdf",
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  db: mongooseAdapter({
    url: "mongodb://localhost:27017/next-payload-3",
  }),
});
`

    fse.writeFileSync(configPath, defaultConfig)
    return { message: 'Created default payload.config.ts', success: true }
  }
}
