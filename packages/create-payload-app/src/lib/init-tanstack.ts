import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CliArgs, DbType, PackageManager, TanStackAppDetails } from '../types.js'

import { debug } from '../utils/log.js'
import {
  DEFAULT_PAYLOAD_VERSION_TAG,
  resolvePackageVersion,
} from '../utils/resolvePackageVersion.js'
import { getDbPackageName } from './ast/adapter-config.js'
import { updatePackageJson } from './ast/package-json.js'
import { configurePayloadTsConfig } from './configure-payload-tsconfig.js'
import { ensurePnpmBuildApprovals } from './configure-pnpm-builds.js'
import { installPackages } from './install-packages.js'
import { getTanStackAppDetails } from './tanstack/detect.js'
import { applyPreparedWrites, prepareTanStackInit } from './tanstack/prepare.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type InitTanStackArgs = {
  appDetails?: TanStackAppDetails
  dbType: DbType
  packageManager: PackageManager
  projectDir: string
  templateRoot?: string
} & Pick<CliArgs, '--debug' | '--no-deps' | '--payload-version'>

type InitTanStackResult =
  | { payloadConfigPath: string; success: true }
  | { reason: string; success: false }

export async function initTanStack(args: InitTanStackArgs): Promise<InitTanStackResult> {
  const appDetailsResult = args.appDetails
    ? { details: args.appDetails, success: true as const }
    : await detectAppDetails({ projectDir: args.projectDir })

  if (!appDetailsResult.success) {
    return appDetailsResult
  }

  const { details: appDetails } = appDetailsResult
  const templateRoot = args.templateRoot ?? resolveTemplateRoot()

  if (args['--debug']) {
    debug(`Using TanStack template files from: ${templateRoot}`)
  }

  const prepared = await prepareTanStackInit({ appDetails, templateRoot })
  if (!prepared.success) {
    return prepared
  }

  await applyPreparedWrites({ writes: prepared.writes })

  if (appDetails.kind === 'router-only') {
    updatePackageJson(path.join(args.projectDir, 'package.json'), {
      removeDependencies: ['@tanstack/router-plugin'],
    })
  }

  if (!args['--no-deps']) {
    const payloadVersion = await resolvePackageVersion({
      debug: args['--debug'],
      packageName: 'payload',
      versionOrTag: args['--payload-version'] ?? DEFAULT_PAYLOAD_VERSION_TAG,
    })
    const packagesToInstall = getPackagesToInstall({
      appDetails,
      dbType: args.dbType,
      payloadVersion,
    })

    await ensurePnpmBuildApprovals({
      packageManager: args.packageManager,
      projectDir: args.projectDir,
    })

    const installation = await installPackages({
      packageManager: args.packageManager,
      packagesToInstall,
      projectDir: args.projectDir,
    })
    if (!installation.success) {
      return { reason: 'Failed to install dependencies', success: false }
    }
  }

  const payloadConfigPath = path.join(appDetails.sourceDir, 'payload.config.ts')
  await configurePayloadTsConfig({
    configPath: path.join(args.projectDir, 'tsconfig.json'),
    payloadConfigPath,
  })

  return { payloadConfigPath, success: true }
}

async function detectAppDetails({
  projectDir,
}: {
  projectDir: string
}): Promise<{ details: TanStackAppDetails; success: true } | { reason: string; success: false }> {
  const detection = await getTanStackAppDetails({ projectDir })

  if (!detection.detected) {
    return {
      reason: `Could not detect a TanStack application in ${projectDir}.`,
      success: false,
    }
  }

  if (!detection.compatible) {
    return { reason: detection.reason, success: false }
  }

  return { details: detection.details, success: true }
}

function getPackagesToInstall({
  appDetails,
  dbType,
  payloadVersion,
}: {
  appDetails: TanStackAppDetails
  dbType: DbType
  payloadVersion: string
}): string[] {
  const packages = [
    'payload',
    '@payloadcms/tanstack-start',
    '@payloadcms/ui',
    '@payloadcms/richtext-lexical',
    '@payloadcms/plugin-mcp',
  ].map((packageName) => `${packageName}@${payloadVersion}`)

  packages.push(
    `${getDbPackageName(dbType)}@${payloadVersion}`,
    'graphql@^16.8.1',
    'sharp@0.34.2',
    '@vitejs/plugin-rsc@^0.5.21',
  )

  if (appDetails.kind === 'router-only') {
    packages.push('@tanstack/react-start@^1.168.26')
  }

  return packages
}

function resolveTemplateRoot(): string {
  return path.basename(path.dirname(dirname)) === 'dist'
    ? path.resolve(dirname, '../template-tanstack')
    : path.resolve(dirname, '../../../../templates/blank-tanstack/src')
}
