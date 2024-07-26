/* eslint-disable jest/no-conditional-in-test */
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

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const commonNextCreateParams =
  '--typescript --eslint --no-tailwind --app --import-alias="@/*" --turbo --yes'

const nextCreateCommands: Partial<Record<'noSrcDir' | 'srcDir', string>> = {
  noSrcDir: `pnpm create next-app@canary . ${commonNextCreateParams} --no-src-dir`,
  srcDir: `pnpm create next-app@canary . ${commonNextCreateParams} --src-dir`,
}

describe('create-payload-app', () => {
  beforeAll(() => {
    // Runs copyfiles copy app/(payload) -> dist/app/(payload)
    shelljs.exec('pnpm build:create-payload-app')
  })

  describe.each(Object.keys(nextCreateCommands))(`--init-next with %s`, (nextCmdKey) => {
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
      const { exitCode, stderr } = await execa(cmd, [...args], {
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
    })

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
      if (firstResult.success === false && 'nextAppDir' in firstResult) {
        fs.mkdirSync(path.resolve(firstResult.nextAppDir, '(app)'))
        fs.readdirSync(path.resolve(firstResult.nextAppDir)).forEach((file) => {
          if (file === '(app)') return
          fs.renameSync(
            path.resolve(firstResult.nextAppDir, file),
            path.resolve(firstResult.nextAppDir, '(app)', file),
          )
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

      expect(result.success).toEqual(true)
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
      expect(userTsConfig.compilerOptions.paths?.['@payload-config']).toStrictEqual([
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
  })
})
