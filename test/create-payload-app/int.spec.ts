import type { CompilerOptions } from 'typescript'

import * as CommentJson from 'comment-json'
import { initNext } from 'create-payload-app/commands'
import execa from 'execa'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import tempy from 'tempy'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const commonNextCreateParams = '--typescript --eslint --no-tailwind --app --import-alias="@/*"'

const nextCreateCommands: Partial<Record<'noSrcDir' | 'srcDir', string>> = {
  noSrcDir: `pnpm create next-app@latest . ${commonNextCreateParams} --no-src-dir`,
  srcDir: `pnpm create next-app@latest . ${commonNextCreateParams} --src-dir`,
}

describe('create-payload-app', () => {
  beforeAll(() => {
    // Runs copyfiles copy app/(payload) -> dist/app/(payload)
    shelljs.exec('pnpm build:create-payload-app')
  })

  describe('Next.js app template files', () => {
    it('should exist in dist', () => {
      const distPath = path.resolve(dirname, '../../packages/create-payload-app/dist/app/(payload)')
      expect(fs.existsSync(distPath)).toBe(true)
    })
  })

  describe.each(Object.keys(nextCreateCommands))(`--init-next with %s`, (nextCmdKey) => {
    const projectDir = tempy.directory()
    beforeEach(async () => {
      if (fs.existsSync(projectDir)) {
        fs.rmdirSync(projectDir, { recursive: true })
      }

      // Create dir for Next.js project
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir)
      }

      // Create a new Next.js project with default options
      console.log(`Running: ${nextCreateCommands[nextCmdKey]} in ${projectDir}`)
      const [cmd, ...args] = nextCreateCommands[nextCmdKey].split(' ')
      const { exitCode, stderr } = await execa(cmd, [...args], { cwd: projectDir })
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
        fs.rmdirSync(projectDir, { recursive: true })
      }
    })

    it('should install payload app in Next.js project', async () => {
      expect(fs.existsSync(projectDir)).toBe(true)

      const result = await initNext({
        '--debug': true,
        projectDir,
        useDistFiles: true, // create-payload-app/dist/app/(payload)
      })

      expect(result.success).toBe(true)

      const payloadFilesPath = path.resolve(result.userAppDir, '(payload)')
      expect(fs.existsSync(payloadFilesPath)).toBe(true)

      const payloadConfig = path.resolve(projectDir, 'payload.config.ts')
      expect(fs.existsSync(payloadConfig)).toBe(true)

      const tsConfigPath = path.resolve(projectDir, 'tsconfig.json')
      const userTsConfigContent = await readFile(tsConfigPath, { encoding: 'utf8' })
      const userTsConfig = CommentJson.parse(userTsConfigContent) as {
        compilerOptions?: CompilerOptions
      }
      expect(userTsConfig.compilerOptions.paths?.['@payload-config']).toStrictEqual([
        './payload.config.ts',
      ])

      // TODO: Start the Next.js app and check if it runs
    })
  })
})
