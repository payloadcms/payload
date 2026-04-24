import { spawn } from 'child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DevServerResult } from './nextDevServer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function startTanStackStartDevServer({
  port,
  testSuiteArg,
}: {
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  const rootDir = path.resolve(__dirname, '../../tanstack-app')
  const adminRoute = '/admin'

  const viteBin = path.resolve(rootDir, 'node_modules/.bin/vite')

  return new Promise<DevServerResult>((resolve, reject) => {
    const child = spawn(
      viteBin,
      ['dev', '--port', String(port), '--strictPort', '--configLoader', 'runner'],
      {
        cwd: rootDir,
        env: {
          ...process.env,
          PORT: String(port),
          NODE_ENV: 'development',
          PAYLOAD_CORE_DEV: 'true',
          PAYLOAD_DROP_DATABASE: process.env.PAYLOAD_DROP_DATABASE ?? 'true',
          PAYLOAD_TEST_SUITE: testSuiteArg,
          ROOT_DIR: rootDir,
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
        resolve({ adminRoute, port, rootDir })
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
        resolve({ adminRoute, port, rootDir })
      }
    }, 30000)
  })
}
