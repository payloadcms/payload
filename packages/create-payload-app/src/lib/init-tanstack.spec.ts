import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
}))

vi.mock('../utils/resolvePackageVersion.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolvePackageVersion: mocks.resolvePackageVersion,
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
  const templateRoot = '/tmp/tanstack-template'
  let appDetails: TanStackAppDetails
  let preparedWrites: Array<{ content: string; filePath: string }>
  let projectDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-init-tanstack-'))
    appDetails = createAppDetails({ kind: 'start', projectDir })
    preparedWrites = [
      {
        content: 'export default {}\n',
        filePath: path.join(projectDir, 'src/payload.config.ts'),
      },
    ]
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

  afterEach(() => {
    fse.removeSync(projectDir)
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
        '@payloadcms/plugin-mcp@4.2.0',
        '@payloadcms/richtext-lexical@4.2.0',
        '@payloadcms/tanstack-start@4.2.0',
        '@payloadcms/ui@4.2.0',
        '@vitejs/plugin-rsc@^0.5.21',
        databasePackage,
        'graphql@^16.8.1',
        'payload@4.2.0',
      ],
      projectDir,
    })
  })

  it('should replace Router-only plugin package metadata', async () => {
    appDetails = createAppDetails({ kind: 'router-only', projectDir })
    const packageJsonPath = path.join(projectDir, 'package.json')
    const originalPackageContent = `{
  "name": "router-app",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "@tanstack/router-plugin": "^1.0.0",
    "payload": "^4.0.0"
  },
  "devDependencies": {
    "@tanstack/router-plugin": "^1.0.0",
    "typescript": "^6.0.0"
  }
}`
    fse.writeFileSync(packageJsonPath, originalPackageContent)

    await initTanStack({
      appDetails,
      dbType: 'mongodb',
      packageManager: 'yarn',
      projectDir,
      templateRoot,
    })

    expect(mocks.applyPreparedWrites).toHaveBeenCalledWith({
      writes: [
        ...preparedWrites,
        {
          content: `{
  "name": "router-app",
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "payload": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.0"
  }
}\n`,
          filePath: packageJsonPath,
        },
      ],
    })
    expect(fse.readFileSync(packageJsonPath, 'utf8')).toBe(originalPackageContent)
    expect(mocks.installPackages).toHaveBeenCalledWith({
      packageManager: 'yarn',
      packagesToInstall: [
        '@payloadcms/plugin-mcp@4.2.0',
        '@payloadcms/richtext-lexical@4.2.0',
        '@payloadcms/tanstack-start@4.2.0',
        '@payloadcms/ui@4.2.0',
        '@vitejs/plugin-rsc@^0.5.21',
        '@payloadcms/db-mongodb@4.2.0',
        'graphql@^16.8.1',
        'payload@4.2.0',
        '@tanstack/react-start@^1.168.26',
      ],
      projectDir,
    })
  })

  it('should reject malformed Router package metadata before applying host writes', async () => {
    appDetails = createAppDetails({ kind: 'router-only', projectDir })
    const packageJsonPath = path.join(projectDir, 'package.json')
    const malformedPackageContent = '{ "dependencies": {'
    fse.writeFileSync(packageJsonPath, malformedPackageContent)

    const result = await initTanStack({
      appDetails,
      dbType: 'mongodb',
      packageManager: 'pnpm',
      projectDir,
      templateRoot,
    })

    expect(result.success).toBe(false)
    if (result.success) {
      throw new Error('Expected malformed package metadata to fail preparation.')
    }
    expect(result.reason).toContain('Could not prepare package.json')
    expect(fse.readFileSync(packageJsonPath, 'utf8')).toBe(malformedPackageContent)
    expect(mocks.applyPreparedWrites).not.toHaveBeenCalled()
    expect(mocks.installPackages).not.toHaveBeenCalled()
  })

  it.each([
    {
      existingDependencies: {
        '@tanstack/react-router': '^1.200.0',
        '@tanstack/react-start': '^1.200.0',
        react: '^19.0.0',
      },
      existingDevDependencies: { vite: '^7.0.0' },
      expectedDependencies: {
        '@payloadcms/db-postgres': '4.2.0',
        '@payloadcms/plugin-mcp': '4.2.0',
        '@payloadcms/richtext-lexical': '4.2.0',
        '@payloadcms/tanstack-start': '4.2.0',
        '@payloadcms/ui': '4.2.0',
        '@tanstack/react-router': '^1.200.0',
        '@tanstack/react-start': '^1.200.0',
        '@vitejs/plugin-rsc': '^0.5.21',
        graphql: '^16.8.1',
        payload: '4.2.0',
        react: '^19.0.0',
      },
      expectedDevDependencies: { vite: '^7.0.0' },
      kind: 'start' as const,
    },
    {
      existingDependencies: {
        '@tanstack/react-router': '^1.200.0',
        react: '^19.0.0',
      },
      existingDevDependencies: {
        '@tanstack/router-plugin': '^1.200.0',
        vite: '^7.0.0',
      },
      expectedDependencies: {
        '@payloadcms/db-postgres': '4.2.0',
        '@payloadcms/plugin-mcp': '4.2.0',
        '@payloadcms/richtext-lexical': '4.2.0',
        '@payloadcms/tanstack-start': '4.2.0',
        '@payloadcms/ui': '4.2.0',
        '@tanstack/react-router': '^1.200.0',
        '@tanstack/react-start': '^1.168.26',
        '@vitejs/plugin-rsc': '^0.5.21',
        graphql: '^16.8.1',
        payload: '4.2.0',
        react: '^19.0.0',
      },
      expectedDevDependencies: { vite: '^7.0.0' },
      kind: 'router-only' as const,
    },
  ])(
    'should record required dependencies without installing them for a $kind project with --no-deps',
    async ({
      existingDependencies,
      existingDevDependencies,
      expectedDependencies,
      expectedDevDependencies,
      kind,
    }) => {
      appDetails = createAppDetails({ kind, projectDir })
      const packageJsonPath = path.join(projectDir, 'package.json')
      fse.writeJsonSync(packageJsonPath, {
        dependencies: existingDependencies,
        devDependencies: existingDevDependencies,
        name: `${kind}-app`,
      })

      const result = await initTanStack({
        '--no-deps': true,
        appDetails,
        dbType: 'postgres',
        packageManager: 'pnpm',
        projectDir,
        templateRoot,
      })

      expect(result.success).toBe(true)
      expect(mocks.resolvePackageVersion).toHaveBeenCalledWith({
        debug: undefined,
        packageName: 'payload',
        versionOrTag: 'canary',
      })
      expect(mocks.ensurePnpmBuildApprovals).not.toHaveBeenCalled()
      expect(mocks.installPackages).not.toHaveBeenCalled()
      expect(mocks.configurePayloadTsConfig).toHaveBeenCalledOnce()

      const appliedWrites = mocks.applyPreparedWrites.mock.calls[0]?.[0].writes as Array<{
        content: string
        filePath: string
      }>
      const packageJsonWrite = appliedWrites.find(({ filePath }) => filePath === packageJsonPath)

      expect(JSON.parse(packageJsonWrite?.content ?? '{}')).toEqual({
        dependencies: expectedDependencies,
        devDependencies: expectedDevDependencies,
        name: `${kind}-app`,
      })
    },
  )

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

  it('should return a failure when dependency installation rejects', async () => {
    mocks.installPackages.mockRejectedValue(new Error('Command failed with exit code 1'))

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
