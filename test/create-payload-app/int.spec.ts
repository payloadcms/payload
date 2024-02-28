import fs from 'fs'
import path from 'path'
import shelljs from 'shelljs'

import { initNext } from '../../packages/create-payload-app/src/lib/init-next'

describe('create-payload-app', () => {
  describe('--init-next', () => {
    const nextDir = path.resolve(__dirname, 'test-app')

    beforeAll(() => {
      if (fs.existsSync(nextDir)) {
        fs.rmdirSync(nextDir, { recursive: true })
      }

      // Create dir for Next.js project
      if (!fs.existsSync(nextDir)) {
        fs.mkdirSync(nextDir)
      }

      // Create a new Next.js project with default options
      shelljs.exec(
        'pnpm create next-app@latest . --typescript --eslint --no-tailwind --app --import-alias="@/*" --src-dir',
        { cwd: nextDir },
      )
    })

    afterAll(() => {
      if (fs.existsSync(nextDir)) {
        fs.rmdirSync(nextDir, { recursive: true })
      }
    })

    it('should install payload app in Next.js project', async () => {
      expect(fs.existsSync(nextDir)).toBe(true)

      const result = await initNext({
        '--debug': true,
        nextDir,
        useDistFiles: true, // create-payload-app must be built
      })

      expect(result.success).toBe(true)
      const payloadFilesPath = path.resolve(nextDir, 'src/app/(payload)')
      expect(fs.existsSync(payloadFilesPath)).toBe(true)
    })
  })
})
