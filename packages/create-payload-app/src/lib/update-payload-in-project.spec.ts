import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextAppDetails, TanStackAppDetails } from '../types.js'

import {
  updatePayloadInNextProject,
  updatePayloadInTanStackProject,
  updatePayloadPackages,
} from './update-payload-in-project.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const mocks = vi.hoisted(() => ({
  getPackageManager: vi.fn(),
  installPackages: vi.fn(),
  resolvePackageVersion: vi.fn(),
}))

vi.mock('../utils/resolvePackageVersion.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolvePackageVersion: mocks.resolvePackageVersion,
}))

vi.mock('./get-package-manager.js', () => ({
  getPackageManager: mocks.getPackageManager,
}))

vi.mock('./install-packages.js', () => ({
  installPackages: mocks.installPackages,
}))

describe('Payload project updates', () => {
  let projectDir: string
  let templateRoot: string

  beforeEach(() => {
    vi.clearAllMocks()
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-update-project-'))
    templateRoot = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-update-template-'))
    mocks.getPackageManager.mockResolvedValue('pnpm')
    mocks.installPackages.mockResolvedValue({ success: true })
    mocks.resolvePackageVersion.mockResolvedValue('4.2.0')
  })

  afterEach(() => {
    fse.removeSync(projectDir)
    fse.removeSync(templateRoot)
  })

  it('should update every installed Payload dependency to one version without a Next config', async () => {
    fse.writeJsonSync(path.join(projectDir, 'package.json'), {
      dependencies: {
        '@payloadcms/db-mongodb': '^3.0.0',
        '@payloadcms/richtext-lexical': '^3.0.0',
        payload: '^3.0.0',
        react: '^19.0.0',
      },
    })

    const result = await updatePayloadPackages({ projectDir, versionOrTag: 'beta' })

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(mocks.resolvePackageVersion).toHaveBeenCalledOnce()
    expect(mocks.resolvePackageVersion).toHaveBeenCalledWith({
      packageName: 'payload',
      versionOrTag: 'beta',
    })
    expect(mocks.installPackages).toHaveBeenCalledWith({
      packageManager: 'pnpm',
      packagesToInstall: [
        'payload@4.2.0',
        '@payloadcms/db-mongodb@4.2.0',
        '@payloadcms/richtext-lexical@4.2.0',
      ],
      projectDir,
    })
  })

  it('should update a stale Payload package when payload is already at the target version', async () => {
    fse.writeJsonSync(path.join(projectDir, 'package.json'), {
      dependencies: {
        '@payloadcms/ui': '4.1.0',
        payload: '4.2.0',
      },
    })

    const result = await updatePayloadPackages({ projectDir, versionOrTag: 'beta' })

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(mocks.installPackages).toHaveBeenCalledWith({
      packageManager: 'pnpm',
      packagesToInstall: ['payload@4.2.0', '@payloadcms/ui@4.2.0'],
      projectDir,
    })
  })

  it('should update Payload packages installed as development dependencies', async () => {
    fse.writeJsonSync(path.join(projectDir, 'package.json'), {
      dependencies: {
        '@payloadcms/ui': '4.1.0',
        payload: '4.1.0',
      },
      devDependencies: {
        '@payloadcms/graphql': '4.1.0',
        vitest: '^4.0.0',
      },
    })

    const result = await updatePayloadPackages({ projectDir, versionOrTag: 'beta' })

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(mocks.installPackages).toHaveBeenCalledWith({
      packageManager: 'pnpm',
      packagesToInstall: ['payload@4.2.0', '@payloadcms/ui@4.2.0', '@payloadcms/graphql@4.2.0'],
      projectDir,
    })
  })

  it('should refresh Next Payload routes without overwriting custom CSS', async () => {
    writeProjectPackage(projectDir)
    const nextConfigPath = path.join(projectDir, 'next.config.ts')
    const payloadDir = path.join(projectDir, 'src/app/(payload)')
    const importMapPath = path.join(payloadDir, 'admin/importMap.js')
    const customCssPath = path.join(payloadDir, 'custom.css')
    const sourceImportMapPath = path.resolve(
      dirname,
      '../../../../templates/blank/src/app/(payload)/admin/importMap.js',
    )
    fse.outputFileSync(importMapPath, 'stale import map\n')
    fse.outputFileSync(customCssPath, '.custom { color: rebeccapurple; }\n')

    const appDetails: NextAppDetails = {
      hasTopLevelLayout: false,
      isPayloadInstalled: true,
      isSrcDir: true,
      isSupportedNextVersion: true,
      nextConfigPath,
      nextVersion: '15.0.0',
    }

    const result = await updatePayloadInNextProject({ appDetails, versionOrTag: 'beta' })

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(fse.readFileSync(importMapPath, 'utf8')).toBe(
      fse.readFileSync(sourceImportMapPath, 'utf8'),
    )
    expect(fse.readFileSync(customCssPath, 'utf8')).toBe('.custom { color: rebeccapurple; }\n')
  })

  it('should refresh only Payload-owned TanStack route files', async () => {
    writeProjectPackage(projectDir)
    writeFiles({
      files: {
        'routes/_payload.tsx': 'fresh payload layout\n',
        'routes/_payload/admin.$.tsx': 'fresh admin splat\n',
        'routes/_payload/admin.index.tsx': 'fresh admin index\n',
        'routes/_payload/api.$.ts': 'fresh API route\n',
        'routes/_payload/importMap.js': 'fresh import map\n',
        'routes/_payload/server.functions.ts': 'fresh server functions\n',
        'src/payload-foundation.css': 'template Payload CSS\n',
        'src/payload.config.ts': 'template Payload config\n',
      },
      root: templateRoot,
    })
    writeFiles({
      files: {
        'src/router.tsx': 'custom router\n',
        'src/routes/__root.tsx': 'custom root route\n',
        'src/routes/_frontend.tsx': 'custom frontend layout\n',
        'src/routes/_frontend/index.tsx': 'custom frontend route\n',
        'src/routes/_payload.tsx': 'stale payload layout\n',
        'src/routes/_payload/admin.$.tsx': 'stale admin splat\n',
        'src/routes/_payload/admin.index.tsx': 'stale admin index\n',
        'src/routes/_payload/api.$.ts': 'stale API route\n',
        'src/routes/_payload/importMap.js': 'stale import map\n',
        'src/routes/_payload/server.functions.ts': 'stale server functions\n',
        'src/styles.css': 'custom frontend CSS\n',
        'vite.config.ts': 'custom Vite config\n',
      },
      root: projectDir,
    })

    const appDetails: TanStackAppDetails = {
      isPayloadInstalled: true,
      kind: 'start',
      projectDir,
      rootRoutePath: path.join(projectDir, 'src/routes/__root.tsx'),
      routerPath: path.join(projectDir, 'src/router.tsx'),
      routesDir: path.join(projectDir, 'src/routes'),
      sourceDir: path.join(projectDir, 'src'),
      viteConfigPath: path.join(projectDir, 'vite.config.ts'),
    }

    const preservedFiles = [
      appDetails.viteConfigPath,
      appDetails.routerPath,
      appDetails.rootRoutePath,
      path.join(appDetails.routesDir, '_frontend.tsx'),
      path.join(appDetails.routesDir, '_frontend/index.tsx'),
      path.join(appDetails.sourceDir, 'styles.css'),
    ]
    const before = new Map(
      preservedFiles.map((filePath) => [filePath, fse.readFileSync(filePath, 'utf8')]),
    )

    const result = await updatePayloadInTanStackProject({
      appDetails,
      templateRoot,
      versionOrTag: 'beta',
    })

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(fse.readFileSync(path.join(appDetails.routesDir, '_payload.tsx'), 'utf8')).toBe(
      'fresh payload layout\n',
    )
    expect(
      fse.readFileSync(path.join(appDetails.routesDir, '_payload/server.functions.ts'), 'utf8'),
    ).toBe('fresh server functions\n')
    for (const [filePath, content] of before) {
      expect(fse.readFileSync(filePath, 'utf8')).toBe(content)
    }
  })

  it('should refresh TanStack routes from the source template by default', async () => {
    writeProjectPackage(projectDir)
    const payloadLayoutPath = path.join(projectDir, 'src/routes/_payload.tsx')
    const sourcePayloadLayoutPath = path.resolve(
      dirname,
      '../../../../templates/blank-tanstack/src/app/_payload.tsx',
    )
    fse.outputFileSync(payloadLayoutPath, 'stale payload layout\n')

    const appDetails: TanStackAppDetails = {
      isPayloadInstalled: true,
      kind: 'start',
      projectDir,
      rootRoutePath: path.join(projectDir, 'src/routes/__root.tsx'),
      routerPath: path.join(projectDir, 'src/router.tsx'),
      routesDir: path.join(projectDir, 'src/routes'),
      sourceDir: path.join(projectDir, 'src'),
      viteConfigPath: path.join(projectDir, 'vite.config.ts'),
    }

    await updatePayloadInTanStackProject({ appDetails, versionOrTag: 'beta' })

    expect(fse.readFileSync(payloadLayoutPath, 'utf8')).toBe(
      fse.readFileSync(sourcePayloadLayoutPath, 'utf8'),
    )
  })
})

function writeFiles({ files, root }: { files: Record<string, string>; root: string }): void {
  for (const [relativePath, content] of Object.entries(files)) {
    fse.outputFileSync(path.join(root, relativePath), content)
  }
}

function writeProjectPackage(projectDir: string): void {
  fse.writeJsonSync(path.join(projectDir, 'package.json'), {
    dependencies: {
      '@payloadcms/ui': '^3.0.0',
      payload: '^3.0.0',
    },
  })
}
