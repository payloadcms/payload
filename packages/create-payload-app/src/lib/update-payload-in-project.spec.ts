import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextAppDetails } from '../types.js'

import { resolveImportMapFilePath } from '../../../payload/src/bin/generateImportMap/utilities/resolveImportMapFilePath.js'
import { updatePayloadInProject } from './update-payload-in-project.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const mocks = vi.hoisted(() => ({
  getPackageManager: vi.fn(),
  installPackages: vi.fn(),
  getLatestPackageVersion: vi.fn(),
}))

vi.mock('../utils/getLatestPackageVersion.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getLatestPackageVersion: mocks.getLatestPackageVersion,
}))

vi.mock('./get-package-manager.js', () => ({
  getPackageManager: mocks.getPackageManager,
}))

vi.mock('./install-packages.js', () => ({
  installPackages: mocks.installPackages,
}))

describe('Payload project updates', () => {
  let projectDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('JEST_WORKER_ID', '1')
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-update-project-'))
    mocks.getPackageManager.mockResolvedValue('pnpm')
    mocks.installPackages.mockResolvedValue({ success: true })
    mocks.getLatestPackageVersion.mockResolvedValue('3.99.0')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    fse.removeSync(projectDir)
  })

  it('should skip config analysis when Payload is already up to date', async () => {
    fse.writeJsonSync(path.join(projectDir, 'package.json'), {
      dependencies: { payload: '3.99.0', '@payloadcms/ui': '3.99.0' },
    })
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({ routes: { admin: process.env.ADMIN_ROUTE } })",
    )

    const result = await updatePayloadInProject(nextDetails({ projectDir, appDir: 'src/app' }))

    expect(result).toEqual({ message: 'Payload v3.99.0 is already up to date.', success: true })
    expect(mocks.installPackages).not.toHaveBeenCalled()
    expect(fse.existsSync(path.join(projectDir, 'src/app'))).toBe(false)
  })

  it('should refresh Next Payload routes without overwriting custom CSS', async () => {
    writeProjectPackage(projectDir)
    const nextConfigPath = path.join(projectDir, 'next.config.ts')
    const payloadDir = path.join(projectDir, 'src/app/(payload)')
    const importMapPath = path.join(payloadDir, 'admin/importMap.js')
    const customStylesPath = path.join(payloadDir, 'custom.scss')
    const sourceImportMapPath = path.resolve(
      dirname,
      '../../../../templates/blank/src/app/(payload)/admin/importMap.js',
    )
    fse.outputFileSync(importMapPath, 'stale import map\n')
    fse.outputFileSync(customStylesPath, '.custom { color: rebeccapurple; }\n')

    const appDetails: NextAppDetails = {
      hasTopLevelLayout: false,
      isPayloadInstalled: true,
      isSrcDir: true,
      isSupportedNextVersion: true,
      nextConfigPath,
      nextVersion: '15.4.0',
    }

    const result = await updatePayloadInProject(appDetails)

    expect(result).toEqual({ message: 'Payload updated successfully.', success: true })
    expect(fse.readFileSync(importMapPath, 'utf8')).toBe(
      fse.readFileSync(sourceImportMapPath, 'utf8'),
    )
    expect(fse.readFileSync(customStylesPath, 'utf8')).toBe('.custom { color: rebeccapurple; }\n')
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
    fse.outputFileSync(path.join(payloadDir, 'custom.scss'), '.custom { color: red; }')

    const result = await updatePayloadInProject(nextDetails({ projectDir, appDir }))

    expect(result.success).toBe(true)
    expect(await resolveImportMapFilePath({ adminRoute, rootDir: projectDir })).toBe(importMapPath)
    expect(fse.readFileSync(pagePath, 'utf8')).toBe(
      fse.readFileSync(path.join(sourceDir, 'admin/[[...segments]]/page.tsx'), 'utf8'),
    )
    expect(fse.readFileSync(importMapPath, 'utf8')).toBe(
      fse.readFileSync(path.join(sourceDir, 'admin/importMap.js'), 'utf8'),
    )
    expect(fse.readFileSync(path.join(payloadDir, 'custom.scss'), 'utf8')).toBe(
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

      await updatePayloadInProject(nextDetails({ projectDir, appDir: 'src/app' }))

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

      await updatePayloadInProject(nextDetails({ projectDir: childDir, appDir: 'app' }))

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

      await updatePayloadInProject(nextDetails({ projectDir, appDir }))

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
      updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' })),
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

    await updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' }))

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

      await updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' }))

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

    await updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' }))

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
      updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' })),
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

    await updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' }))

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
      updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' })),
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
        updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' })),
      ).rejects.toThrow('routes.admin')

      expect(mocks.installPackages).not.toHaveBeenCalled()
      expect(fse.existsSync(path.join(projectDir, 'app/(payload)'))).toBe(false)
    },
  )

  it('should retain the default route when the config does not customize it', async () => {
    writeProjectPackage(projectDir)
    fse.outputFileSync(
      path.join(projectDir, 'payload.config.ts'),
      "import { buildConfig } from 'payload'; export default buildConfig({})",
    )

    await updatePayloadInProject(nextDetails({ projectDir, appDir: 'app' }))

    expect(
      fse.existsSync(path.join(projectDir, 'app/(payload)/admin/[[...segments]]/page.tsx')),
    ).toBe(true)
    expect(fse.readFileSync(path.join(projectDir, 'app/(payload)/layout.tsx'), 'utf8')).toContain(
      "from './admin/importMap.js'",
    )
  })
})

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
    nextVersion: '15.4.0',
  }
}
