import { spawn } from 'child_process'
import { createRequire } from 'module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DevServerResult } from './nextDevServer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const READY_SENTINEL = 'Listening on'

/**
 * Boot a real production TanStack Start server: run `vite build` to produce the
 * `dist/app-tanstack` output, then serve it with `srvx` — TanStack's
 * recommended Node host, which serves the built `{ fetch }` handler and the
 * static client assets in one process.
 *
 * `vite preview` cannot be used here — it only serves the static client build,
 * but this app has no `index.html`; all HTML is streamed by the server handler.
 *
 * The build bundles Payload from source but leaves its runtime deps (`pino`,
 * `mongodb`, …) external. Those live only in pnpm's flat virtual store, which
 * Node can't reach walking up from `dist/`, so we symlink the server output's
 * `node_modules` to that store before serving.
 */
export async function startTanStackStartProdServer({
  port,
  testSuiteArg,
}: {
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  const adminRoute = '/admin'

  const testDir = path.resolve(__dirname, '..')
  const repoRoot = path.resolve(testDir, '..')
  const viteBin = path.resolve(testDir, 'node_modules/.bin/vite')
  const configPath = path.resolve(testDir, 'vite.tanstack.prod.config.ts')

  const outDir = path.resolve(repoRoot, 'dist/app-tanstack')
  const clientDir = path.resolve(outDir, 'client')
  const serverEntry = path.resolve(outDir, 'server/server.js')

  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production' as const,
    PAYLOAD_CORE_DEV: 'true',
    PAYLOAD_TEST_SUITE: testSuiteArg,
    ROOT_DIR: testDir,
  }

  await new Promise<void>((resolve, reject) => {
    const build = spawn(viteBin, ['build', '--configLoader', 'runner', '--config', configPath], {
      cwd: testDir,
      env: buildEnv,
      stdio: 'inherit',
    })

    build.on('error', reject)
    build.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`vite build exited with code ${code}`))
      }
    })
  })

  const pnpmVirtualStore = path.resolve(testDir, 'node_modules/.pnpm/node_modules')
  if (fs.existsSync(pnpmVirtualStore)) {
    const serverNodeModules = path.resolve(outDir, 'server/node_modules')
    fs.rmSync(serverNodeModules, { force: true, recursive: true })
    fs.symlinkSync(pnpmVirtualStore, serverNodeModules, 'junction')
  }

  // srvx is a transitive dep (no `.bin` entry), so resolve its CLI from the
  // pnpm virtual store, where all packages are linked.
  const require = createRequire(path.join(pnpmVirtualStore, 'noop.js'))
  const srvxMain = require.resolve('srvx')
  const srvxRoot = srvxMain.slice(0, srvxMain.lastIndexOf(`${path.sep}srvx${path.sep}`) + 6)
  const srvxBin = path.join(srvxRoot, 'bin/srvx.mjs')

  return new Promise<DevServerResult>((resolve, reject) => {
    const server = spawn(
      process.execPath,
      [srvxBin, '--prod', '--port', String(port), '-s', clientDir, serverEntry],
      {
        cwd: repoRoot,
        env: { ...buildEnv, PORT: String(port) },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )

    let resolved = false

    server.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      process.stdout.write(output)
      if (!resolved && output.includes(READY_SENTINEL)) {
        resolved = true
        resolve({ adminRoute, port, rootDir: testDir })
      }
    })

    server.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data.toString())
    })

    server.on('error', (err) => {
      if (!resolved) {
        reject(err)
      }
    })

    server.on('exit', (code) => {
      if (!resolved) {
        reject(new Error(`srvx exited with code ${code}`))
      }
    })

    process.on('SIGINT', () => server.kill('SIGINT'))
    process.on('SIGTERM', () => server.kill('SIGTERM'))
  })
}
