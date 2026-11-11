import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextAppDetails, TanStackAppDetails } from '../types.js'

import { resolveImportMapFilePath } from '../../../payload/src/cli/commands/generateImportMap/utilities/resolveImportMapFilePath.js'
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
    vi.stubEnv('JEST_WORKER_ID', '1')
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-update-project-'))
    templateRoot = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-update-template-'))
    mocks.getPackageManager.mockResolvedValue('pnpm')
    mocks.installPackages.mockResolvedValue({ success: true })
    mocks.resolvePackageVersion.mockResolvedValue('4.2.0')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    fse.removeSync(projectDir)
    fse.removeSync(templateRoot)
  })

  it('should skip config analysis when Payload is already up to date', async () => {
    fse.writeJsonSync(path.join(projectDir, 'package.json'), {
      dependencies: { payload: '4.2.0', '@payloadcms/ui': '4.2.0' },
    })
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: process.env.ADMIN_ROUTE } })",
    )

    const result = await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'src/app' }),
    })

    expect(result).toEqual({ message: 'Payload v4.2.0 is already up to date.', success: true })
    expect(mocks.installPackages).not.toHaveBeenCalled()
    expect(fse.existsSync(path.join(projectDir, 'src/app'))).toBe(false)
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
      nextVersion: '16.4.0',
    }

    const result = await updatePayloadInNextProject({ appDetails, versionOrTag: 'beta' })

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(fse.readFileSync(importMapPath, 'utf8')).toBe(
      fse.readFileSync(sourceImportMapPath, 'utf8'),
    )
    expect(fse.readFileSync(customCssPath, 'utf8')).toBe('.custom { color: rebeccapurple; }\n')
  })

  it.each([
    { appDir: 'app', adminRoute: '/cms' },
    { appDir: 'app', adminRoute: '/admin/content' },
    { appDir: 'app', adminRoute: '/' },
    { appDir: 'src/app', adminRoute: '/cms' },
    { appDir: 'src/app', adminRoute: '/admin/content' },
    { appDir: 'src/app', adminRoute: '/' },
  ])('should upgrade $adminRoute from config in $appDir', async ({ appDir, adminRoute }) => {
    writeProjectPackage(projectDir)
    const payloadDir = path.join(projectDir, appDir, '(payload)')
    const adminDir = path.join(payloadDir, adminRoute.slice(1))
    const sourceDir = path.resolve(dirname, '../../../../templates/blank/src/app/(payload)')
    const pagePath = path.join(adminDir, '[[...segments]]/page.tsx')
    const importMapPath = path.join(adminDir, 'importMap.js')

    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      `
      import { buildConfig } from 'payload'
      throw new Error('Config must not be executed')
      export default buildConfig({ routes: { admin: ${JSON.stringify(adminRoute)} } })
    `,
    )
    fse.outputFileSync(pagePath, 'stale page')
    fse.outputFileSync(importMapPath, 'stale import map')
    fse.outputFileSync(path.join(payloadDir, 'custom.css'), '.custom { color: red; }')

    const result = await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir }),
      versionOrTag: 'beta',
    })

    expect(result.success).toBe(true)
    expect(await resolveImportMapFilePath({ adminRoute, rootDir: projectDir })).toBe(importMapPath)
    expect(fse.readFileSync(pagePath, 'utf8')).toBe(
      fse.readFileSync(path.join(sourceDir, 'admin/[[...segments]]/page.tsx'), 'utf8'),
    )
    expect(fse.readFileSync(importMapPath, 'utf8')).toBe(
      fse.readFileSync(path.join(sourceDir, 'admin/importMap.js'), 'utf8'),
    )
    expect(fse.readFileSync(path.join(payloadDir, 'custom.css'), 'utf8')).toBe(
      '.custom { color: red; }',
    )
    expect(fse.existsSync(path.join(payloadDir, 'admin/[[...segments]]'))).toBe(false)
    const layout = fse.readFileSync(path.join(payloadDir, 'layout.tsx'), 'utf8')
    const relativeMap = adminRoute === '/' ? './importMap.js' : `.${adminRoute}/importMap.js`
    expect(layout).toContain(`from '${relativeMap}'`)
    expect(fse.readFileSync(path.join(payloadDir, 'api/[...slug]/route.ts'), 'utf8')).toBe(
      fse.readFileSync(path.join(sourceDir, 'api/[...slug]/route.ts'), 'utf8'),
    )
  })

  it.each(['src/payload.config.ts', 'cms/config.ts'])(
    'should resolve the admin route from the @payload-config alias to %s',
    async (configPath) => {
      writeProjectPackage(projectDir)
      fse.outputJsonSync(path.join(projectDir, 'tsconfig.json'), {
        compilerOptions: { baseUrl: '.', paths: { '@payload-config': [`./${configPath}`] } },
      })
      fse.outputFileSync(
        path.join(projectDir, configPath),
        "import { buildConfig as configure } from 'payload'; export default configure({ routes: { admin: '/cms' } })",
      )

      await updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir, appDir: 'src/app' }),
        versionOrTag: 'beta',
      })

      expect(
        fse.existsSync(path.join(projectDir, 'src/app/(payload)/cms/[[...segments]]/page.tsx')),
      ).toBe(true)
      expect(fse.existsSync(path.join(projectDir, 'src/app/(payload)/admin'))).toBe(false)
    },
  )

  it.each([false, true])(
    'should resolve an inherited alias from its declaring tsconfig (child config: %s)',
    async (hasChildConfig) => {
      const childDir = path.join(projectDir, 'site')
      fse.ensureDirSync(childDir)
      writeProjectPackage(childDir)
      fse.outputJsonSync(path.join(projectDir, 'tsconfig.base.json'), {
        compilerOptions: { paths: { '@payload-config': ['./payload.config.ts'] } },
      })
      fse.outputJsonSync(path.join(childDir, 'tsconfig.json'), { extends: '../tsconfig.base.json' })
      fse.outputFileSync(
        path.join(projectDir, 'payload.config.ts'),
        "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/cms' } })",
      )
      if (hasChildConfig) {
        fse.outputFileSync(
          path.join(childDir, 'payload.config.ts'),
          "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/wrong' } })",
        )
      }

      await updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir: childDir, appDir: 'app' }),
        versionOrTag: 'beta',
      })

      const payloadDir = path.join(childDir, 'app/(payload)')
      expect(fse.existsSync(path.join(payloadDir, 'cms/[[...segments]]/page.tsx'))).toBe(true)
      expect(fse.existsSync(path.join(payloadDir, 'wrong'))).toBe(false)
      expect(fse.existsSync(path.join(payloadDir, 'admin'))).toBe(false)
      expect(fse.readFileSync(path.join(payloadDir, 'layout.tsx'), 'utf8')).toContain(
        "from './cms/importMap.js'",
      )
    },
  )

  it.each([
    { appDir: 'app', adminRoute: '/_cms', adminFolder: '%5Fcms' },
    { appDir: 'src/app', adminRoute: '/cms/_content', adminFolder: 'cms/%5Fcontent' },
    { appDir: 'app', adminRoute: '/__cms/_content', adminFolder: '%5F_cms/%5Fcontent' },
  ])(
    'should refresh the routable folder for $adminRoute',
    async ({ appDir, adminRoute, adminFolder }) => {
      writeProjectPackage(projectDir)
      const payloadDir = path.join(projectDir, appDir, '(payload)')
      const adminDir = path.join(payloadDir, adminFolder)
      const sourceDir = path.resolve(dirname, '../../../../templates/blank/src/app/(payload)')
      const pagePath = path.join(adminDir, '[[...segments]]/page.tsx')
      fse.outputFileSync(
        path.join(projectDir, 'payload.config.ts'),
        `import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: ${JSON.stringify(adminRoute)} } })`,
      )
      fse.outputFileSync(pagePath, 'stale reachable wrapper')
      fse.outputFileSync(path.join(adminDir, 'importMap.js'), 'stale import map')

      await updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir, appDir }),
        versionOrTag: 'beta',
      })

      expect(fse.readFileSync(pagePath, 'utf8')).toBe(
        fse.readFileSync(path.join(sourceDir, 'admin/[[...segments]]/page.tsx'), 'utf8'),
      )
      expect(fse.readFileSync(path.join(adminDir, 'importMap.js'), 'utf8')).toBe(
        fse.readFileSync(path.join(sourceDir, 'admin/importMap.js'), 'utf8'),
      )
      expect(fse.readFileSync(path.join(payloadDir, 'layout.tsx'), 'utf8')).toContain(
        `from './${adminFolder}/importMap.js'`,
      )
      expect(await resolveImportMapFilePath({ adminRoute, rootDir: projectDir })).toBe(
        path.join(adminDir, 'importMap.js'),
      )
      expect(fse.existsSync(path.join(payloadDir, adminRoute.slice(1)))).toBe(false)
      expect(fse.existsSync(path.join(payloadDir, 'admin'))).toBe(false)
    },
  )

  it.each([
    "{ routes: { admin: '/first', 'admin': '/second' } }",
    "{ routes: { admin: '/first' }, 'routes': { admin: '/second' } }",
  ])('should reject duplicate route properties before updating: %s', async (config) => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.js'),
      `import { buildConfig } from 'payload'; export default buildConfig(${config})`,
    )

    await expect(
      updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir, appDir: 'app' }),
        versionOrTag: 'beta',
      }),
    ).rejects.toThrow(/routes.admin.*duplicate/)

    expect(mocks.installPackages).not.toHaveBeenCalled()
    expect(fse.existsSync(path.join(projectDir, 'app/(payload)'))).toBe(false)
  })

  it.each([
    "{ 'routes': { admin: '/cms' } }",
    "{ routes: { 'admin': '/cms' } }",
    '{ "routes": { "admin": "/cms" } }',
  ])('should honor quoted literal property names: %s', async (config) => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      `import { buildConfig } from 'payload'; export default buildConfig(${config})`,
    )

    await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'app' }),
      versionOrTag: 'beta',
    })

    expect(
      fse.existsSync(path.join(projectDir, 'app/(payload)/cms/[[...segments]]/page.tsx')),
    ).toBe(true)
    expect(fse.existsSync(path.join(projectDir, 'app/(payload)/admin'))).toBe(false)
    expect(fse.readFileSync(path.join(projectDir, 'app/(payload)/layout.tsx'), 'utf8')).toContain(
      "from './cms/importMap.js'",
    )
  })

  it.each(['ts', 'js'])(
    'should resolve an extensionless alias to payload.config.%s',
    async (extension) => {
      writeProjectPackage(projectDir)
      fse.outputJsonSync(path.join(projectDir, 'tsconfig.json'), {
        compilerOptions: { baseUrl: '.', paths: { '@payload-config': ['./cms/payload.config'] } },
      })
      fse.outputFileSync(
        path.join(projectDir, `cms/payload.config.${extension}`),
        "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/cms' } })",
      )

      await updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir, appDir: 'app' }),
        versionOrTag: 'beta',
      })

      expect(
        fse.existsSync(path.join(projectDir, 'app/(payload)/cms/[[...segments]]/page.tsx')),
      ).toBe(true)
      expect(fse.existsSync(path.join(projectDir, 'app/(payload)/admin'))).toBe(false)
    },
  )

  it('should retain an explicit existing JS config path when a TS sibling exists', async () => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/wrong' } })",
    )
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.js'),
      "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/cms' } })",
    )
    vi.stubEnv('PAYLOAD_CONFIG_PATH', path.join(projectDir, 'payload.config.js'))

    await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'app' }),
      versionOrTag: 'beta',
    })

    expect(
      fse.existsSync(path.join(projectDir, 'app/(payload)/cms/[[...segments]]/page.tsx')),
    ).toBe(true)
    expect(fse.existsSync(path.join(projectDir, 'app/(payload)/wrong'))).toBe(false)
  })

  it.each([
    "export default buildConfig({ routes: { admin: '/before' } }).then(config => ({ ...config, routes: { admin: '/live' } }))",
    "function unused() { return buildConfig({ routes: { admin: '/unused' } }) }; export default externalConfig",
    "let config = buildConfig({ routes: { admin: '/before' } }); config = externalConfig; export default config",
  ])('should reject a buildConfig call that is not exported unchanged: %s', async (body) => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      `import { buildConfig } from 'payload'; ${body}`,
    )

    await expect(
      updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir, appDir: 'app' }),
        versionOrTag: 'beta',
      }),
    ).rejects.toThrow('routes.admin')

    expect(mocks.installPackages).not.toHaveBeenCalled()
    expect(fse.existsSync(path.join(projectDir, 'app/(payload)'))).toBe(false)
  })

  it('should accept an unchanged buildConfig result exported through a const', async () => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; const config = buildConfig({ routes: { admin: '/cms' } }); export default config",
    )

    await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'app' }),
      versionOrTag: 'beta',
    })

    expect(
      fse.existsSync(path.join(projectDir, 'app/(payload)/cms/[[...segments]]/page.tsx')),
    ).toBe(true)
    expect(fse.existsSync(path.join(projectDir, 'app/(payload)/admin'))).toBe(false)
  })

  it.each([
    "process.env.ADMIN_ROUTE || '/cms'",
    "process.env.ADMIN_ROUTE as '/cms'",
    "'/../outside'",
    JSON.stringify('/..' + String.fromCharCode(92) + 'outside'),
  ])('should reject an unresolved or unsafe admin route before updating: %s', async (admin) => {
    writeProjectPackage(projectDir)
    const payloadDir = path.join(projectDir, 'app/(payload)')
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      `import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: ${admin} } })`,
    )
    fse.outputFileSync(path.join(payloadDir, 'layout.tsx'), 'existing layout')

    await expect(
      updatePayloadInNextProject({
        appDetails: nextDetails({ projectDir, appDir: 'app' }),
        versionOrTag: 'beta',
      }),
    ).rejects.toThrow('routes.admin')

    expect(mocks.installPackages).not.toHaveBeenCalled()
    expect(fse.readFileSync(path.join(payloadDir, 'layout.tsx'), 'utf8')).toBe('existing layout')
    expect(fse.existsSync(path.join(payloadDir, 'admin'))).toBe(false)
  })

  it.each(["{ routes: { ['admin']: '/cms' } }", "{ ['routes']: { admin: '/cms' } }"])(
    'should reject computed config keys instead of defaulting to /admin: %s',
    async (config) => {
      writeProjectPackage(projectDir)
      fse.outputFileSync(
        path.join(projectDir, 'payload.config.ts'),
        `import { buildConfig } from 'payload'; export default buildConfig(${config})`,
      )

      await expect(
        updatePayloadInNextProject({
          appDetails: nextDetails({ projectDir, appDir: 'app' }),
          versionOrTag: 'beta',
        }),
      ).rejects.toThrow('routes.admin')

      expect(mocks.installPackages).not.toHaveBeenCalled()
      expect(fse.existsSync(path.join(projectDir, 'app/(payload)'))).toBe(false)
    },
  )

  it('should refresh /admin when the alias points to a config without routes', async () => {
    writeProjectPackage(projectDir)
    fse.outputJsonSync(path.join(projectDir, 'tsconfig.json'), {
      compilerOptions: { baseUrl: '.', paths: { '@payload-config': ['./cms/payload.config.ts'] } },
    })
    fse.outputFileSync(
      path.join(projectDir, 'cms/payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({})",
    )
    // The decoy catches fallback discovery that ignores the alias.
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/wrong' } })",
    )

    await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'src/app' }),
      versionOrTag: 'beta',
    })

    const payloadDir = path.join(projectDir, 'src/app/(payload)')

    expect(fse.existsSync(path.join(payloadDir, 'admin/[[...segments]]/page.tsx'))).toBe(true)
    expect(fse.existsSync(path.join(payloadDir, 'wrong'))).toBe(false)
    expect(fse.readFileSync(path.join(payloadDir, 'layout.tsx'), 'utf8')).toContain(
      "from './admin/importMap.js'",
    )
  })

  it('should retain the default route when the config does not customize it', async () => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({})",
    )

    await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'app' }),
      versionOrTag: 'beta',
    })

    expect(
      fse.existsSync(path.join(projectDir, 'app/(payload)/admin/[[...segments]]/page.tsx')),
    ).toBe(true)
    expect(fse.readFileSync(path.join(projectDir, 'app/(payload)/layout.tsx'), 'utf8')).toContain(
      "from './admin/importMap.js'",
    )
  })

  it('should retain the existing stylesheet migration and preserve custom.css when both files exist', async () => {
    writeProjectPackage(projectDir)
    const payloadDir = path.join(projectDir, 'app/(payload)')
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: '/cms' } })",
    )
    fse.outputFileSync(path.join(payloadDir, 'custom.scss'), '.legacy { color: red; }')
    fse.outputFileSync(path.join(payloadDir, 'custom.css'), '.current { color: blue; }')

    await updatePayloadInNextProject({
      appDetails: nextDetails({ projectDir, appDir: 'app' }),
      versionOrTag: 'beta',
    })

    expect(fse.readFileSync(path.join(payloadDir, 'custom.css'), 'utf8')).toBe(
      '.current { color: blue; }',
    )
    expect(fse.readFileSync(path.join(payloadDir, 'custom.scss'), 'utf8')).toBe(
      '.legacy { color: red; }',
    )
    expect(fse.readFileSync(path.join(payloadDir, 'layout.tsx'), 'utf8')).toContain(
      "import './custom.css'",
    )
  })

  it('should refresh Payload-owned TanStack files without overwriting custom styles', async () => {
    writeProjectPackage(projectDir)
    writeFiles({
      files: {
        'routes/_payload.tsx': 'fresh payload layout\n',
        'routes/_payload/admin.$.tsx': 'fresh admin splat\n',
        'routes/_payload/admin.index.tsx': 'fresh admin index\n',
        'routes/_payload/api.$.ts': 'fresh API route\n',
        'routes/_payload/custom.css': '',
        'routes/_payload/importMap.js': 'fresh import map\n',
        'routes/_payload/server.functions.ts': 'fresh server functions\n',
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
        'src/routes/_payload/custom.css': 'custom Payload CSS\n',
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
      path.join(appDetails.routesDir, '_payload/custom.css'),
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
    const sourceCustomStylesPath = path.resolve(
      dirname,
      '../../../../templates/blank-tanstack/src/app/_payload/custom.css',
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
    expect(fse.readFileSync(path.join(appDetails.routesDir, '_payload/custom.css'), 'utf8')).toBe(
      fse.readFileSync(sourceCustomStylesPath, 'utf8'),
    )
    expect(fse.pathExistsSync(path.join(appDetails.sourceDir, 'payload.css'))).toBe(false)
  })
})

/** Create nested template fixtures used by the project updater tests. */
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

function nextDetails({
  appDir,
  projectDir,
}: {
  appDir: string
  projectDir: string
}): NextAppDetails {
  return {
    hasTopLevelLayout: false,
    isPayloadInstalled: true,
    isSrcDir: appDir === 'src/app',
    isSupportedNextVersion: true,
    nextConfigPath: path.join(projectDir, 'next.config.ts'),
    nextVersion: '16.4.0',
  }
}
