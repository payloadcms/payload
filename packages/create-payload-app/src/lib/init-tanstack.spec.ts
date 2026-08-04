import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DbType, TanStackAppDetails } from '../types.js'

import { initTanStack } from './init-tanstack.js'

const mocks = vi.hoisted(() => ({
  applyPreparedWrites: vi.fn(),
  configurePayloadTsConfig: vi.fn(),
  ensurePnpmBuildApprovals: vi.fn(),
  getTanStackAppDetails: vi.fn(),
  installPackages: vi.fn(),
  prepareTanStackInit: vi.fn(),
  resolvePackageVersion: vi.fn(),
  updatePackageJson: vi.fn(),
}))

vi.mock('../utils/resolvePackageVersion.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolvePackageVersion: mocks.resolvePackageVersion,
}))

vi.mock('./ast/package-json.js', () => ({
  updatePackageJson: mocks.updatePackageJson,
}))

vi.mock('./configure-payload-tsconfig.js', () => ({
  configurePayloadTsConfig: mocks.configurePayloadTsConfig,
}))

vi.mock('./configure-pnpm-builds.js', () => ({
  ensurePnpmBuildApprovals: mocks.ensurePnpmBuildApprovals,
}))

vi.mock('./install-packages.js', () => ({
  installPackages: mocks.installPackages,
}))

vi.mock('./tanstack/detect.js', () => ({
  getTanStackAppDetails: mocks.getTanStackAppDetails,
}))

vi.mock('./tanstack/prepare.js', () => ({
  applyPreparedWrites: mocks.applyPreparedWrites,
  prepareTanStackInit: mocks.prepareTanStackInit,
}))

describe('initTanStack', () => {
  const projectDir = '/tmp/tanstack-project'
  const templateRoot = '/tmp/tanstack-template'
  const preparedWrites = [
    {
      content: 'export default {}\n',
      filePath: path.join(projectDir, 'src/payload.config.ts'),
    },
  ]
  let appDetails: TanStackAppDetails

  beforeEach(() => {
    vi.clearAllMocks()
    appDetails = createAppDetails({ kind: 'start', projectDir })
    mocks.prepareTanStackInit.mockResolvedValue({ success: true, writes: preparedWrites })
    mocks.applyPreparedWrites.mockResolvedValue(undefined)
    mocks.ensurePnpmBuildApprovals.mockResolvedValue(undefined)
    mocks.installPackages.mockResolvedValue({ success: true })
    mocks.configurePayloadTsConfig.mockResolvedValue(undefined)
    mocks.resolvePackageVersion.mockResolvedValue('4.2.0')
    mocks.getTanStackAppDetails.mockResolvedValue({
      compatible: true,
      details: appDetails,
      detected: true,
    })
  })

  it('should prepare, apply, install, and configure in order', async () => {
    const result = await initTanStack({
      '--debug': true,
      '--payload-version': 'beta',
      appDetails,
      dbType: 'mongodb',
      packageManager: 'pnpm',
      projectDir,
      templateRoot,
    })

    expect(result).toEqual({
      payloadConfigPath: path.join(projectDir, 'src/payload.config.ts'),
      success: true,
    })
    expect(mocks.prepareTanStackInit).toHaveBeenCalledWith({ appDetails, templateRoot })
    expect(mocks.applyPreparedWrites).toHaveBeenCalledWith({ writes: preparedWrites })
    expect(mocks.prepareTanStackInit).toHaveBeenCalledBefore(mocks.applyPreparedWrites)
    expect(mocks.applyPreparedWrites).toHaveBeenCalledBefore(mocks.installPackages)
    expect(mocks.resolvePackageVersion).toHaveBeenCalledWith({
      debug: true,
      packageName: 'payload',
      versionOrTag: 'beta',
    })
    expect(mocks.ensurePnpmBuildApprovals).toHaveBeenCalledWith({
      packageManager: 'pnpm',
      projectDir,
    })
    expect(mocks.configurePayloadTsConfig).toHaveBeenCalledWith({
      configPath: path.join(projectDir, 'tsconfig.json'),
      payloadConfigPath: path.join(projectDir, 'src/payload.config.ts'),
    })
  })

  it.each<[DbType, string]>([
    ['mongodb', '@payloadcms/db-mongodb@4.2.0'],
    ['postgres', '@payloadcms/db-postgres@4.2.0'],
    ['sqlite', '@payloadcms/db-sqlite@4.2.0'],
  ])('should install the exact Payload dependencies for %s', async (dbType, databasePackage) => {
    await initTanStack({
      appDetails,
      dbType,
      packageManager: 'npm',
      projectDir,
      templateRoot,
    })

    expect(mocks.installPackages).toHaveBeenCalledWith({
      packageManager: 'npm',
      packagesToInstall: [
        'payload@4.2.0',
        '@payloadcms/tanstack-start@4.2.0',
        '@payloadcms/ui@4.2.0',
        '@payloadcms/richtext-lexical@4.2.0',
        '@payloadcms/plugin-mcp@4.2.0',
        databasePackage,
        'graphql@^16.8.1',
        'sharp@0.34.2',
        '@vitejs/plugin-rsc@^0.5.21',
      ],
      projectDir,
    })
  })

  it('should replace Router-only plugin package metadata', async () => {
    appDetails = createAppDetails({ kind: 'router-only', projectDir })

    await initTanStack({
      appDetails,
      dbType: 'mongodb',
      packageManager: 'yarn',
      projectDir,
      templateRoot,
    })

    expect(mocks.updatePackageJson).toHaveBeenCalledWith(path.join(projectDir, 'package.json'), {
      removeDependencies: ['@tanstack/router-plugin'],
    })
    expect(mocks.updatePackageJson).toHaveBeenCalledBefore(mocks.installPackages)
    expect(mocks.installPackages).toHaveBeenCalledWith({
      packageManager: 'yarn',
      packagesToInstall: [
        'payload@4.2.0',
        '@payloadcms/tanstack-start@4.2.0',
        '@payloadcms/ui@4.2.0',
        '@payloadcms/richtext-lexical@4.2.0',
        '@payloadcms/plugin-mcp@4.2.0',
        '@payloadcms/db-mongodb@4.2.0',
        'graphql@^16.8.1',
        'sharp@0.34.2',
        '@vitejs/plugin-rsc@^0.5.21',
        '@tanstack/react-start@^1.168.26',
      ],
      projectDir,
    })
  })

  it('should skip version resolution and package installation with --no-deps', async () => {
    const result = await initTanStack({
      '--no-deps': true,
      appDetails,
      dbType: 'postgres',
      packageManager: 'pnpm',
      projectDir,
      templateRoot,
    })

    expect(result.success).toBe(true)
    expect(mocks.resolvePackageVersion).not.toHaveBeenCalled()
    expect(mocks.ensurePnpmBuildApprovals).not.toHaveBeenCalled()
    expect(mocks.installPackages).not.toHaveBeenCalled()
    expect(mocks.configurePayloadTsConfig).toHaveBeenCalledOnce()
  })

  it('should return the preparation failure without applying writes', async () => {
    mocks.prepareTanStackInit.mockResolvedValue({ reason: 'unsafe host transform', success: false })

    const result = await initTanStack({
      appDetails,
      dbType: 'sqlite',
      packageManager: 'bun',
      projectDir,
      templateRoot,
    })

    expect(result).toEqual({ reason: 'unsafe host transform', success: false })
    expect(mocks.applyPreparedWrites).not.toHaveBeenCalled()
    expect(mocks.installPackages).not.toHaveBeenCalled()
  })

  it('should return a failure when dependency installation fails', async () => {
    mocks.installPackages.mockResolvedValue({ success: false })

    const result = await initTanStack({
      appDetails,
      dbType: 'mongodb',
      packageManager: 'npm',
      projectDir,
      templateRoot,
    })

    expect(result).toEqual({ reason: 'Failed to install dependencies', success: false })
    expect(mocks.configurePayloadTsConfig).not.toHaveBeenCalled()
  })

  it('should detect app details when none are provided', async () => {
    const result = await initTanStack({
      dbType: 'mongodb',
      packageManager: 'npm',
      projectDir,
      templateRoot,
    })

    expect(result.success).toBe(true)
    expect(mocks.getTanStackAppDetails).toHaveBeenCalledWith({ projectDir })
    expect(mocks.prepareTanStackInit).toHaveBeenCalledWith({ appDetails, templateRoot })
  })
})

function createAppDetails({
  kind,
  projectDir,
}: {
  kind: TanStackAppDetails['kind']
  projectDir: string
}): TanStackAppDetails {
  return {
    isPayloadInstalled: false,
    kind,
    projectDir,
    rootRoutePath: path.join(projectDir, 'src/routes/__root.tsx'),
    routerPath: path.join(projectDir, 'src/router.tsx'),
    routesDir: path.join(projectDir, 'src/routes'),
    sourceDir: path.join(projectDir, 'src'),
    viteConfigPath: path.join(projectDir, 'vite.config.ts'),
  }
}
