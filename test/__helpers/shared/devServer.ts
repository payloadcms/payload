import type { ChildProcess } from 'node:child_process'

import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

export type DevServer = {
  serverURL: string
  stop: () => Promise<void>
}

export type TestServerProcess = {
  child: ChildProcess
  getOutput: () => string
  stop: () => Promise<void>
}

export async function startDevServer({
  framework,
  readyPath,
  suite,
  timeout = 270000,
  warmupPaths = [],
}: {
  framework: 'next' | 'tanstack-start'
  /** Endpoint that returns a successful response once the app is ready. */
  readyPath: string
  suite: string
  /** Startup budget in milliseconds, including route warmup. Leave time for cleanup in the caller's hook timeout. */
  timeout?: number
  /** Routes to compile before the test begins. */
  warmupPaths?: string[]
}): Promise<DevServer> {
  const port = await getFreePort()
  const serverURL = `http://localhost:${port}`
  const server = spawnTestServer({
    args: ['dev', suite, `--framework-${framework}`, '--no-seed'],
    captureOutput: true,
    env: getDevServerEnv({ port }),
  })
  const signal = AbortSignal.timeout(timeout)

  try {
    await waitForServer({ child: server.child, signal, url: `${serverURL}${readyPath}` })

    for (const route of warmupPaths) {
      const response = await fetch(`${serverURL}${route}`, { signal })

      await response.body?.cancel()
    }
  } catch (err) {
    await server.stop()
    throw new Error(`${framework} dev server did not start:\n${server.getOutput()}`, { cause: err })
  }

  return { serverURL, stop: server.stop }
}

/** Starts the test CLI in its own process group so cleanup reaches the framework server. */
export function spawnTestServer({
  args,
  captureOutput = false,
  env = process.env,
}: {
  args: string[]
  captureOutput?: boolean
  env?: NodeJS.ProcessEnv
}): TestServerProcess {
  const child = spawn('pnpm', args, {
    cwd: repoRoot,
    detached: true,
    env: { ...env },
    stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })
  let output = ''

  child.stdout?.on('data', (data: Buffer) => (output += data.toString()))
  child.stderr?.on('data', (data: Buffer) => (output += data.toString()))

  return {
    child,
    getOutput: () => output,
    stop: () => stopProcessGroup({ child }),
  }
}

/**
 * The Vitest process runs with `NODE_ENV=test`, which disables dev config reloading, and with
 * int-test flags that a regular `pnpm dev` session doesn't have.
 */
function getDevServerEnv({ port }: { port: number }): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'development',
    PAYLOAD_DROP_DATABASE: 'true',
    PORT: String(port),
  }

  delete env.PAYLOAD_DISABLE_ADMIN

  for (const key of Object.keys(env)) {
    if (key.startsWith('VITEST')) {
      delete env[key]
    }
  }

  return env
}

async function waitForServer({
  child,
  signal,
  url,
}: {
  child: ChildProcess
  signal: AbortSignal
  url: string
}): Promise<void> {
  while (!signal.aborted) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Dev server exited with ${child.signalCode ?? child.exitCode}`)
    }

    try {
      const response = await fetch(url, { signal })

      await response.body?.cancel()
      if (response.ok) {
        return
      }
    } catch (err) {
      if (signal.aborted) {
        throw err
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  signal.throwIfAborted()
}

async function stopProcessGroup({ child }: { child: ChildProcess }): Promise<void> {
  if (child.exitCode !== null || !child.pid) {
    return
  }

  const killGroup = (signal: NodeJS.Signals) => {
    try {
      process.kill(-child.pid!, signal)
    } catch {
      // Already exited
    }
  }

  await new Promise<void>((resolve) => {
    const killTimer = setTimeout(() => killGroup('SIGKILL'), 15000)

    child.once('exit', () => {
      clearTimeout(killTimer)
      resolve()
    })

    killGroup('SIGTERM')
  })
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.once('error', reject)
    server.listen(0, () => {
      const address = server.address()

      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port)
        } else {
          reject(new Error('Could not determine a free port'))
        }
      })
    })
  })
}
