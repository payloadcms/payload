import type { CompilerOptions } from 'typescript'

import * as CommentJson from 'comment-json'
import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

import { initNext } from '../../packages/create-payload-app/src/lib/init-next.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const readFile = promisify(fs.readFile)

const nextCreateCommands: Partial<Record<'noSrcDir' | 'srcDir', string>> = {
  srcDir:
    'pnpm create next-app@latest . --typescript --eslint --no-tailwind --app --import-alias="@/*" --src-dir',
  noSrcDir:
    'pnpm create next-app@latest . --typescript --eslint --no-tailwind --app --import-alias="@/*" --no-src-dir',
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
    const projectDir = path.resolve(dirname, 'test-app')

    beforeEach(() => {
      if (fs.existsSync(projectDir)) {
        fs.rmdirSync(projectDir, { recursive: true })
      }

      // Create dir for Next.js project
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir)
      }

      // Create a new Next.js project with default options
      shelljs.exec(nextCreateCommands[nextCmdKey], { cwd: projectDir })
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
      expect(userTsConfig.compilerOptions.paths?.['@payload-config']).toEqual([
        './payload.config.ts',
      ])
    })
  })
})
