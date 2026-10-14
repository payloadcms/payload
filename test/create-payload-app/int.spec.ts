import type { CompilerOptions } from 'typescript'

import * as CommentJson from 'comment-json'
import { getTanStackAppDetails, initNext, initTanStack } from 'create-payload-app/commands'
import execa from 'execa'
import fs from 'fs'
import fse from 'fs-extra'
import path from 'path'
import shelljs from 'shelljs'
import tempy from 'tempy'
import { promisify } from 'util'
import { expect, vi } from 'vitest'

import type * as InstallPackagesModule from '../../packages/create-payload-app/src/lib/install-packages.js'

import { configurePayloadConfig } from '../../packages/create-payload-app/src/lib/configure-payload-config.js'
import { test } from '../__helpers/int/vitest.js'

/** Payload package name -> absolute `file:` spec of its locally packed tarball. */
const localPackageSpecs = vi.hoisted(() => new Map<string, string>())

// Payload packages install from local tarballs, so the version is only a placeholder. It is
// unpublished, so any Payload package that misses a local tarball fails the install loudly.
vi.mock('../../packages/create-payload-app/src/utils/resolvePackageVersion.js', () => ({
  DEFAULT_PAYLOAD_VERSION_TAG: 'canary',
  resolvePackageVersion: () => Promise.resolve('0.0.0-local-tarball'),
}))

// pnpm ignores `overrides` for specs passed to `pnpm add`, so direct Payload deps are rewritten here
vi.mock('../../packages/create-payload-app/src/lib/install-packages.js', async (importOriginal) => {
  const actual = await importOriginal<typeof InstallPackagesModule>()

  return {
    installPackages: (args: Parameters<typeof actual.installPackages>[0]) =>
      actual.installPackages({
        ...args,
        packagesToInstall: args.packagesToInstall.map((spec) => toLocalPackageSpec({ spec })),
      }),
  }
})

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const commonNextCreateParams =
  '--typescript --eslint --no-tailwind --app --import-alias="@/*" --turbo --yes'

const commandKeys = ['srcDir', 'noSrcDir', 'srcDirCanary', 'noSrcDirCanary'] as const
type NextCmdKey = (typeof commandKeys)[number]

const nextCreateCommands: Record<NextCmdKey, string> = {
  srcDir: `pnpm create next-app@latest . ${commonNextCreateParams} --src-dir`,
  noSrcDir: `pnpm create next-app@latest . ${commonNextCreateParams} --no-src-dir`,
  srcDirCanary: `pnpm create next-app@canary . ${commonNextCreateParams} --src-dir`,
  noSrcDirCanary: `pnpm create next-app@canary . ${commonNextCreateParams} --no-src-dir`,
}

const tanStackCreateArgs = [
  'dlx',
  '@tanstack/cli@latest',
  'create',
  'test-app',
  '--framework',
  'React',
  '--blank',
  '--package-manager',
  'pnpm',
  '--no-git',
  '--no-intent',
  '--no-toolchain',
  '--non-interactive',
]

const packedDir = tempy.directory()

test.suite('create-payload-app', {}, () => {
  test.beforeAll(async () => {
    // Runs copyfiles copy app/(payload) -> dist/app/(payload)
    shelljs.exec('pnpm build:create-payload-app')

    // Requires `pnpm build:all`. Local tarballs keep installs independent of npm publish propagation.
    await execa('pnpm', ['run', 'script:pack', '--all', '--no-build', '--dest', packedDir], {
      stdio: 'inherit',
    })
    loadLocalPackageSpecs({ packedDir })
  })

  test.afterAll(() => {
    fs.rmSync(packedDir, { force: true, recursive: true })
  })

  test.describe.each(commandKeys)(`--init-next with %s`, (nextCmdKey) => {
    const projectDir = tempy.directory()
    test.beforeEach(async () => {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }

      // Create dir for Next.js project
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir)
      }

      // Create a new Next.js project with default options
      console.log(`Running: ${nextCreateCommands[nextCmdKey]} in ${projectDir}`)
      const [cmd, ...args] = nextCreateCommands[nextCmdKey].split(' ')
      console.log(`Running: ${cmd} ${args.join(' ')}`)
      const { exitCode, stderr } = await execa(cmd as string, [...args], {
        cwd: projectDir,
        stdio: 'inherit',
      })
      if (exitCode !== 0) {
        console.error({ exitCode, stderr })
      }

      // WARNING: Big WTF here. Replace improper path string inside tsconfig.json.
      // For some reason two double quotes are used for the src path when executed in the test environment.
      // This is likely ESM-related
      const tsConfigPath = path.resolve(projectDir, 'tsconfig.json')
      let userTsConfigContent = await readFile(tsConfigPath, { encoding: 'utf8' })
      userTsConfigContent = userTsConfigContent.replace('""@/*""', '"@/*"')
      await writeFile(tsConfigPath, userTsConfigContent, { encoding: 'utf8' })

      useLocalPayloadPackages({ projectDir })
    }, 90000)

    test.afterEach(() => {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }
    })

    test('should install payload app in Next.js project', async () => {
      expect(fs.existsSync(projectDir)).toBe(true)

      const firstResult = await initNext({
        '--debug': true,
        dbType: 'mongodb',
        packageManager: 'pnpm',
        projectDir,
        useDistFiles: true, // create-payload-app/dist/template
      })

      // Will fail because we detect top-level layout.tsx file
      expect(firstResult.success).toEqual(false)

      // Move all files from app to top-level directory named `(app)`
      if (firstResult.success === false && firstResult.nextAppDir) {
        const nextAppDir = firstResult.nextAppDir
        fs.mkdirSync(path.resolve(nextAppDir, '(app)'))
        fs.readdirSync(path.resolve(nextAppDir)).forEach((file) => {
          if (file === '(app)') {
            return
          }
          fs.renameSync(path.resolve(nextAppDir, file), path.resolve(nextAppDir, '(app)', file))
        })
      }

      // Rerun after moving files
      const result = await initNext({
        '--debug': true,
        dbType: 'mongodb',
        packageManager: 'pnpm',
        projectDir,
        useDistFiles: true, // create-payload-app/dist/app/(payload)
      })

      assertAndExpectToBeTrue(result.success) // Narrowing for TS
      expectLocalPayloadPackages({ projectDir })
      expect(result.nextAppDir).toEqual(
        path.resolve(projectDir, result.isSrcDir ? 'src/app' : 'app'),
      )

      const payloadFilesPath = path.resolve(result.nextAppDir, '(payload)')
      // shelljs.exec(`tree ${projectDir}`)
      expect(fs.existsSync(payloadFilesPath)).toBe(true)

      const payloadConfig = path.resolve(
        projectDir,
        result.isSrcDir ? 'src/payload.config.ts' : 'payload.config.ts',
      )
      expect(fs.existsSync(payloadConfig)).toBe(true)

      const tsConfigPath = path.resolve(projectDir, 'tsconfig.json')
      const userTsConfigContent = await readFile(tsConfigPath, { encoding: 'utf8' })
      const userTsConfig = CommentJson.parse(userTsConfigContent) as {
        compilerOptions?: CompilerOptions
      }

      // Check that `@payload-config` path is added to tsconfig
      expect(userTsConfig.compilerOptions?.paths?.['@payload-config']).toEqual([
        `./${result.isSrcDir ? 'src/' : ''}payload.config.ts`,
      ])

      // Payload dependencies should be installed
      const packageJson = fse.readJsonSync(path.resolve(projectDir, 'package.json')) as {
        dependencies: Record<string, string>
      }
      expect(packageJson.dependencies).toMatchObject({
        '@payloadcms/db-mongodb': expect.any(String),
        '@payloadcms/next': expect.any(String),
        '@payloadcms/richtext-lexical': expect.any(String),
        payload: expect.any(String),
      })
    })

    test('should install payload app with postgres adapter', async () => {
      expect(fs.existsSync(projectDir)).toBe(true)

      const firstResult = await initNext({
        '--debug': true,
        dbType: 'postgres',
        packageManager: 'pnpm',
        projectDir,
        useDistFiles: true,
      })

      expect(firstResult.success).toEqual(false)

      // Move files to (app) directory
      if (firstResult.success === false && firstResult.nextAppDir) {
        const nextAppDir = firstResult.nextAppDir
        fs.mkdirSync(path.resolve(nextAppDir, '(app)'))
        fs.readdirSync(path.resolve(nextAppDir)).forEach((file) => {
          if (file === '(app)') {
            return
          }
          fs.renameSync(path.resolve(nextAppDir, file), path.resolve(nextAppDir, '(app)', file))
        })
      }

      // Rerun with postgres
      const result = await initNext({
        '--debug': true,
        dbType: 'postgres',
        packageManager: 'pnpm',
        projectDir,
        useDistFiles: true,
      })

      assertAndExpectToBeTrue(result.success)
      expectLocalPayloadPackages({ projectDir })

      // Configure payload config to use postgres (mimics main.ts flow)
      const { configurePayloadConfig: configureFromLib } = await import(
        '../../packages/create-payload-app/src/lib/configure-payload-config.js'
      )
      await configureFromLib({
        dbType: 'postgres',
        projectDirOrConfigPath: {
          payloadConfigPath: result.payloadConfigPath,
        },
      })

      const payloadConfig = path.resolve(
        projectDir,
        result.isSrcDir ? 'src/payload.config.ts' : 'payload.config.ts',
      )
      const configContent = fs.readFileSync(payloadConfig, 'utf-8')
      expect(configContent).toContain('postgresAdapter')
      expect(configContent).toContain('@payloadcms/db-postgres')

      // Postgres dependencies should be installed
      const packageJson = fse.readJsonSync(path.resolve(projectDir, 'package.json')) as {
        dependencies: Record<string, string>
      }
      expect(packageJson.dependencies).toMatchObject({
        '@payloadcms/db-postgres': expect.any(String),
        '@payloadcms/next': expect.any(String),
        '@payloadcms/richtext-lexical': expect.any(String),
        payload: expect.any(String),
      })
      expect(packageJson.dependencies['@payloadcms/db-mongodb']).toBeUndefined()
    })
  })

  test.describe('official TanStack generator', () => {
    let projectDir: string

    test.afterEach(() => {
      if (projectDir && fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }
    })

    test('should initialize and build a generated TanStack Start project', async () => {
      projectDir = tempy.directory()
      await createTanStackProject({ projectDir })

      const indexPath = path.join(projectDir, 'src/routes/index.tsx')
      const originalIndex = await readFile(indexPath, 'utf8')
      const detection = await getTanStackAppDetails({ projectDir })

      assertAndExpectToBeTrue(detection.detected)
      assertAndExpectToBeTrue(detection.compatible)
      expect(detection.details).toMatchObject({
        isPayloadInstalled: false,
        kind: 'start',
        projectDir,
      })

      const result = await initTanStack({
        '--debug': true,
        appDetails: detection.details,
        dbType: 'mongodb',
        packageManager: 'pnpm',
        projectDir,
      })

      assertAndExpectToBeTrue(result.success)
      expectLocalPayloadPackages({ projectDir })
      await configurePayloadConfig({
        dbType: 'mongodb',
        projectDirOrConfigPath: { payloadConfigPath: result.payloadConfigPath },
      })

      expect(await readFile(indexPath, 'utf8')).toBe(originalIndex)
      expectRequiredTanStackFiles({ projectDir })
      expectTanStackIntegration({ projectDir })

      const packageJson = fse.readJsonSync(path.join(projectDir, 'package.json')) as {
        dependencies: Record<string, string>
        devDependencies?: Record<string, string>
      }
      expect(packageJson.dependencies).toMatchObject({
        '@payloadcms/db-mongodb': expect.any(String),
        '@payloadcms/plugin-mcp': expect.any(String),
        '@payloadcms/richtext-lexical': expect.any(String),
        '@payloadcms/tanstack-start': expect.any(String),
        '@payloadcms/ui': expect.any(String),
        '@tanstack/react-start': expect.any(String),
        '@vitejs/plugin-rsc': expect.any(String),
        payload: expect.any(String),
      })

      await execa('pnpm', ['build'], { cwd: projectDir, stdio: 'inherit' })
    }, 300_000)

    test('should initialize and build a generated TanStack Router-only project', async () => {
      projectDir = tempy.directory()
      await createTanStackProject({ projectDir, routerOnly: true })

      const preservedPaths = ['index.html', 'src/main.tsx', 'src/routes/index.tsx']
      const originalContents = new Map(
        await Promise.all(
          preservedPaths.map(
            async (relativePath) =>
              [relativePath, await readFile(path.join(projectDir, relativePath), 'utf8')] as const,
          ),
        ),
      )
      const detection = await getTanStackAppDetails({ projectDir })

      assertAndExpectToBeTrue(detection.detected)
      assertAndExpectToBeTrue(detection.compatible)
      expect(detection.details).toMatchObject({
        isPayloadInstalled: false,
        kind: 'router-only',
        projectDir,
      })

      const result = await initTanStack({
        '--debug': true,
        appDetails: detection.details,
        dbType: 'mongodb',
        packageManager: 'pnpm',
        projectDir,
      })

      assertAndExpectToBeTrue(result.success)
      expectLocalPayloadPackages({ projectDir })
      await configurePayloadConfig({
        dbType: 'mongodb',
        projectDirOrConfigPath: { payloadConfigPath: result.payloadConfigPath },
      })

      for (const [relativePath, originalContent] of originalContents) {
        expect(await readFile(path.join(projectDir, relativePath), 'utf8')).toBe(originalContent)
      }
      expectRequiredTanStackFiles({ projectDir })
      expectTanStackIntegration({ projectDir })

      const packageJson = fse.readJsonSync(path.join(projectDir, 'package.json')) as {
        dependencies: Record<string, string>
        devDependencies?: Record<string, string>
      }
      expect(packageJson.dependencies).toMatchObject({
        '@payloadcms/db-mongodb': expect.any(String),
        '@payloadcms/plugin-mcp': expect.any(String),
        '@payloadcms/richtext-lexical': expect.any(String),
        '@payloadcms/tanstack-start': expect.any(String),
        '@payloadcms/ui': expect.any(String),
        '@tanstack/react-start': expect.any(String),
        '@vitejs/plugin-rsc': expect.any(String),
        payload: expect.any(String),
      })
      expect(packageJson.dependencies['@tanstack/router-plugin']).toBeUndefined()
      expect(packageJson.devDependencies?.['@tanstack/router-plugin']).toBeUndefined()
      expect(fse.readFileSync(path.join(projectDir, 'vite.config.ts'), 'utf8')).not.toContain(
        '@tanstack/router-plugin',
      )

      await execa('pnpm', ['build'], { cwd: projectDir, stdio: 'inherit' })
    }, 300_000)
  })

  test.describe('adapter replacement', () => {
    const projectDir = tempy.directory()

    test.beforeEach(async () => {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }

      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir)
      }

      // Create Next.js project
      console.log(`Creating test project in ${projectDir}`)
      const [cmd, ...args] = nextCreateCommands.srcDir.split(' ')
      const { exitCode, stderr } = await execa(cmd as string, [...args], {
        cwd: projectDir,
        stdio: 'inherit',
      })
      if (exitCode !== 0) {
        console.error({ exitCode, stderr })
      }

      // Fix tsconfig.json path issue
      const tsConfigPath = path.resolve(projectDir, 'tsconfig.json')
      let userTsConfigContent = await readFile(tsConfigPath, { encoding: 'utf8' })
      userTsConfigContent = userTsConfigContent.replace('""@/*""', '"@/*"')
      await writeFile(tsConfigPath, userTsConfigContent, { encoding: 'utf8' })

      useLocalPayloadPackages({ projectDir })
    })

    test.afterEach(() => {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }
    })

    test('should replace mongodb with postgres adapter', async () => {
      // First install with mongodb
      const firstResult = await initNext({
        '--debug': true,
        dbType: 'mongodb',
        packageManager: 'pnpm',
        projectDir,
        useDistFiles: true,
      })

      expect(firstResult.success).toEqual(false)

      // Move files to (app)
      if (firstResult.success === false && firstResult.nextAppDir) {
        const nextAppDir = firstResult.nextAppDir
        fs.mkdirSync(path.resolve(nextAppDir, '(app)'))
        fs.readdirSync(path.resolve(nextAppDir)).forEach((file) => {
          if (file === '(app)') {
            return
          }
          fs.renameSync(path.resolve(nextAppDir, file), path.resolve(nextAppDir, '(app)', file))
        })
      }

      // Install with mongodb
      const mongoResult = await initNext({
        '--debug': true,
        dbType: 'mongodb',
        packageManager: 'pnpm',
        projectDir,
        useDistFiles: true,
      })

      assertAndExpectToBeTrue(mongoResult.success)
      expectLocalPayloadPackages({ projectDir })

      // Verify mongodb is installed
      const packageJson = fse.readJsonSync(path.resolve(projectDir, 'package.json')) as {
        dependencies: Record<string, string>
      }
      expect(packageJson.dependencies['@payloadcms/db-mongodb']).toBeDefined()

      // Now replace with postgres using AST (simulates manual adapter replacement)
      const { configurePayloadConfig } = await import(
        '../../packages/create-payload-app/src/lib/ast/payload-config.js'
      )
      const payloadConfig = path.resolve(
        projectDir,
        mongoResult.isSrcDir ? 'src/payload.config.ts' : 'payload.config.ts',
      )

      const replaceResult = await configurePayloadConfig(payloadConfig, {
        db: { type: 'postgres', envVarName: 'DATABASE_URL' },
      })

      expect(replaceResult.success).toBe(true)

      // Verify config file was updated
      const configContent = fs.readFileSync(payloadConfig, 'utf-8')
      expect(configContent).toContain('postgresAdapter')
      expect(configContent).toContain('@payloadcms/db-postgres')
      expect(configContent).not.toContain('mongooseAdapter')
      expect(configContent).not.toContain('@payloadcms/db-mongodb')
    })
  })
})

// Expect and assert that actual is true for type narrowing
function assertAndExpectToBeTrue(actual: unknown): asserts actual is true {
  expect(actual).toBe(true)
}

async function createTanStackProject({
  projectDir,
  routerOnly = false,
}: {
  projectDir: string
  routerOnly?: boolean
}): Promise<void> {
  const args = [...tanStackCreateArgs]
  if (routerOnly) {
    args.push('--router-only')
  }
  args.push('--target-dir', projectDir)

  await execa('pnpm', args, { stdio: 'inherit' })
  useLocalPayloadPackages({ projectDir })
}

/**
 * Maps each packed Payload package to an absolute `file:` spec usable from any project dir.
 * pnpm names tarballs `<scope>-<name>-<version>.tgz`, e.g. `payloadcms-ui-4.0.0.tgz`.
 */
function loadLocalPackageSpecs({ packedDir }: { packedDir: string }): Map<string, string> {
  const tarballs = fs
    .readdirSync(packedDir)
    .filter((file) => /^payload(?:cms)?-.*\.tgz$/.test(file))

  for (const file of tarballs) {
    const packageName = file.replace(/-\d.*\.tgz$/, '').replace(/^payloadcms-/, '@payloadcms/')
    localPackageSpecs.set(packageName, `file:${path.join(packedDir, file)}`)
  }

  return localPackageSpecs
}

/** Rewrites `name@version` to `name@file:<tarball>` when a local tarball exists for `name`. */
function toLocalPackageSpec({ spec }: { spec: string }): string {
  const packageName = spec.slice(0, spec.lastIndexOf('@'))
  const localSpec = localPackageSpecs.get(packageName)

  return localSpec ? `${packageName}@${localSpec}` : spec
}

/**
 * Overrides transitive Payload deps with the local tarballs.
 * `ensurePnpmBuildApprovals` merges into this file later and keeps the `overrides` block.
 */
function useLocalPayloadPackages({ projectDir }: { projectDir: string }): void {
  const overrideLines = [...localPackageSpecs].map(
    ([packageName, spec]) => `  '${packageName}': '${spec}'`,
  )
  fs.appendFileSync(
    path.join(projectDir, 'pnpm-workspace.yaml'),
    `\noverrides:\n${overrideLines.join('\n')}\n`,
  )
}

/** Fails if the lockfile resolves any Payload package, direct or transitive, from the registry. */
function expectLocalPayloadPackages({ projectDir }: { projectDir: string }): void {
  const lockfile = fs.readFileSync(path.join(projectDir, 'pnpm-lock.yaml'), 'utf8')
  const registryPayloadPackages = lockfile.match(
    /^ {2}'?(?:payload|@payloadcms\/[\w-]+)@(?!file:)[^:\n]+/gm,
  )

  expect(registryPayloadPackages).toBeNull()
}

function expectRequiredTanStackFiles({ projectDir }: { projectDir: string }): void {
  const relativePaths = [
    'src/collections/Folders.ts',
    'src/collections/Media.ts',
    'src/collections/Tags.ts',
    'src/collections/Users.ts',
    'src/payload.config.ts',
    'src/routes/_payload.tsx',
    'src/routes/_payload/admin.$.tsx',
    'src/routes/_payload/admin.index.tsx',
    'src/routes/_payload/api.$.ts',
    'src/routes/_payload/custom.css',
    'src/routes/_payload/importMap.js',
    'src/routes/_payload/server.functions.ts',
  ]

  for (const relativePath of relativePaths) {
    expect(fs.existsSync(path.join(projectDir, relativePath))).toBe(true)
  }
}

function expectTanStackIntegration({ projectDir }: { projectDir: string }): void {
  expect(fse.readFileSync(path.join(projectDir, 'vite.config.ts'), 'utf8')).toContain(
    'withPayload(',
  )
  expect(fse.readFileSync(path.join(projectDir, 'src/router.tsx'), 'utf8')).toContain(
    'parseSearch: payloadParseSearch',
  )
  expect(fse.readFileSync(path.join(projectDir, 'src/routes/__root.tsx'), 'utf8')).toContain(
    'withPayloadRoot(',
  )
  expect(fse.readFileSync(path.join(projectDir, 'src/payload.config.ts'), 'utf8')).toContain(
    'mongooseAdapter',
  )

  const tsConfig = CommentJson.parse(
    fse.readFileSync(path.join(projectDir, 'tsconfig.json'), 'utf8'),
  ) as { compilerOptions?: CompilerOptions }
  expect(tsConfig.compilerOptions?.paths?.['@payload-config']).toEqual(['./src/payload.config.ts'])
}
