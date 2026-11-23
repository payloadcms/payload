import { spawn } from 'child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DevServerResult } from './nextDevServer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function startTanstackDevServer({
  port,
  testSuiteArg,
}: {
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  const adminRoute = '/admin'

  // The TanStack app is driven from the `test` package (like the Next test
  // apps): its vite binary, deps, and config all live under `test/`, and Vite
  // runs with `cwd: test/` so it resolves them from `test/node_modules`. The app
  // itself is located via `srcDirectory` in the config.
  const testDir = path.resolve(__dirname, '../..')
  const viteBin = path.resolve(testDir, 'node_modules/.bin/vite')
  const configPath = path.resolve(testDir, 'vite.tanstack.config.ts')

  const cssLoaderUrl = new URL('./registerCssLoader.mjs', import.meta.url).href
  const previousNodeOptions = process.env.NODE_OPTIONS ?? ''
  const nodeOptions = `${previousNodeOptions} --import ${cssLoaderUrl}`.trim()

  return new Promise<DevServerResult>((resolve, reject) => {
    const child = spawn(
      viteBin,
      [
        'dev',
        '--port',
        String(port),
        '--strictPort',
        '--configLoader',
        'runner',
        '--config',
        configPath,
      ],
      {
        // Vite's root is `test/` (keeps generated junk out of the app dirs and
        // resolves deps from `test/node_modules`); the config locates the app
        // via `srcDirectory`.
        cwd: testDir,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          NODE_OPTIONS: nodeOptions,
          PAYLOAD_CORE_DEV: 'true',
          PAYLOAD_DROP_DATABASE: process.env.PAYLOAD_DROP_DATABASE ?? 'true',
          PAYLOAD_TEST_SUITE: testSuiteArg,
          PORT: String(port),
          ROOT_DIR: testDir,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )

    let resolved = false

    child.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      process.stdout.write(output)

      if (!resolved && output.includes('Local:')) {
        resolved = true
        resolve({ adminRoute, port, rootDir: testDir })
      }
    })

    child.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data.toString())
    })

    child.on('error', (err) => {
      if (!resolved) {
        reject(err)
      }
    })

    child.on('exit', (code) => {
      if (!resolved) {
        reject(new Error(`Vite dev server exited with code ${code}`))
      }
    })

    process.on('SIGINT', () => child.kill('SIGINT'))
    process.on('SIGTERM', () => child.kill('SIGTERM'))

    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve({ adminRoute, port, rootDir: testDir })
      }
    }, 30000)
  })
}
