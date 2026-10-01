import { spawn } from 'child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import type { DevServerResult } from './nextDevServer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Resolve `@payloadcms/tanstack-start/node/cssLoader.mjs` from the dev-server
 * root. We resolve it manually rather than importing the module here so the
 * file path can be passed straight to Node's `--import` flag in the spawned
 * Vite process.
 *
 * The loader is what allows CSS/SCSS/LESS statements that survive into the
 * SSR/RSC bundle (e.g. from a prod-packed `@payloadcms/ui/dist/...` tarball
 * that Vite ends up externalizing) to be silently swallowed instead of
 * crashing every admin route with `ERR_UNKNOWN_FILE_EXTENSION`.
 */
function resolveCssLoaderUrl(rootDir: string): null | string {
  const candidates = [
    path.resolve(
      rootDir,
      'node_modules/@payloadcms/tanstack-start/dist/node/registerCssLoader.mjs',
    ),
    path.resolve(__dirname, '../../packages/tanstack-start/dist/node/registerCssLoader.mjs'),
    path.resolve(__dirname, '../../packages/tanstack-start/src/node/registerCssLoader.mjs'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return pathToFileURL(candidate).href
    }
  }
  return null
}

export async function startTanStackStartDevServer({
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
  const testDir = path.resolve(__dirname, '..')
  const viteBin = path.resolve(testDir, 'node_modules/.bin/vite')
  const configPath = path.resolve(testDir, 'vite.tanstack.config.ts')

  const cssLoaderUrl = resolveCssLoaderUrl(testDir)
  const previousNodeOptions = process.env.NODE_OPTIONS ?? ''
  const nodeOptions = cssLoaderUrl
    ? `${previousNodeOptions} --import ${cssLoaderUrl}`.trim()
    : previousNodeOptions

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
          NODE_OPTIONS: nodeOptions,
          PORT: String(port),
          NODE_ENV: 'development',
          PAYLOAD_CORE_DEV: 'true',
          PAYLOAD_DROP_DATABASE: process.env.PAYLOAD_DROP_DATABASE ?? 'true',
          PAYLOAD_TEST_SUITE: testSuiteArg,
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
