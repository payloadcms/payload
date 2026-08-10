import { spawn } from 'child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DevServerResult } from './nextDevServer.js'

import { getNextRootDir } from '../__helpers/shared/getNextRootDir.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const READY_SENTINEL = 'Ready in'

/**
 * Boot a real production Next.js server.
 * Runs the public `next build` CLI to produce the `.next` output,
 * then serves it with `next start` — Next's own production server.
 *
 * A programmatic `next({ dev: false })` + custom `createServer` opts out of some
 * production optimizations (e.g. automatic static optimization), which would undercut
 * the goal of exercising a faithful production environment. `next start` is that server.
 *
 * The build runs in `--experimental-build-mode compile`: it emits the full server
 * bundle, `BUILD_ID`, and every manifest `next start` needs, but skips the static
 * prerender/export pass. That pass requires a reachable DB and trips on test-only
 * routes (e.g. `/test`), and prod e2e renders every page on demand anyway.
 */
export async function startNextProdServer({
  port,
  testSuiteArg,
}: {
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  const { adminRoute, rootDir } = getNextRootDir(testSuiteArg)

  const nextBin = path.resolve(__dirname, '..', 'node_modules/.bin/next')

  const env = {
    ...process.env,
    NODE_ENV: 'production' as const,
    PORT: String(port),
  }

  await new Promise<void>((resolve, reject) => {
    const build = spawn(nextBin, ['build', '--experimental-build-mode', 'compile'], {
      cwd: rootDir,
      env,
      stdio: 'inherit',
    })

    build.on('error', reject)
    build.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`next build exited with code ${code}`))
      }
    })
  })

  return new Promise<DevServerResult>((resolve, reject) => {
    const server = spawn(nextBin, ['start', '--port', String(port)], {
      cwd: rootDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let resolved = false

    server.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      process.stdout.write(output)
      if (!resolved && output.includes(READY_SENTINEL)) {
        resolved = true
        resolve({ adminRoute, port, rootDir })
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
        reject(new Error(`next start exited with code ${code}`))
      }
    })

    process.on('SIGINT', () => server.kill('SIGINT'))
    process.on('SIGTERM', () => server.kill('SIGTERM'))
  })
}
