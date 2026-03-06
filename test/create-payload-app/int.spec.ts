import type { CompilerOptions } from 'typescript'

import * as CommentJson from 'comment-json'
import { initNext } from 'create-payload-app/commands'
import execa from 'execa'
import fs from 'fs'
import fse from 'fs-extra'
import path from 'path'
import shelljs from 'shelljs'
import tempy from 'tempy'
import { promisify } from 'util'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

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
  noSrcDirCanary: `pnpm create next-app@latest . ${commonNextCreateParams} --no-src-dir`,
}

describe('create-payload-app', () => {
  beforeAll(() => {
    // Runs copyfiles copy app/(payload) -> dist/app/(payload)
    shelljs.exec('pnpm build:create-payload-app')
  })

  describe.each(commandKeys)(`--init-next with %s`, (nextCmdKey) => {
    const projectDir = tempy.directory()
    beforeEach(async () => {
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
    }, 90000)

    afterEach(() => {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }
    })

    it('should install payload app in Next.js project', async () => {
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

    it('should install payload app with postgres adapter', async () => {
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

  describe('adapter replacement', () => {
    const projectDir = tempy.directory()

    beforeEach(async () => {
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
    })

    afterEach(() => {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true })
      }
    })

    it('should replace mongodb with postgres adapter', async () => {
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
