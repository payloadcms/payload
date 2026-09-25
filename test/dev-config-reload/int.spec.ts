import type { ChildProcess } from 'node:child_process'

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../..')
const suiteName = path.basename(dirname)

const configMarkerPath = path.resolve(dirname, 'configMarker.ts')

/**
 * Imported by the TanStack test app's `_payload` route but not by the Payload config, so editing it
 * reloads the server runtime without a config change. Nothing imports it under Next.js.
 */
const serverModulePath = path.resolve(dirname, 'tanstackServerFunctions.ts')

/** Edited by the tests, or rewritten by `pnpm dev` and the TanStack router generator. */
const originalSources = new Map(
  [
    configMarkerPath,
    serverModulePath,
    path.resolve(repoRoot, 'tsconfig.base.json'),
    path.resolve(repoRoot, 'app-tanstack/tsconfig.json'),
    path.resolve(repoRoot, 'test/app-tanstack/routeTree.gen.ts'),
  ].map((filePath) => [filePath, fs.readFileSync(filePath, 'utf8')]),
)

const DEV_SERVER_START_TIMEOUT = 5 * 60 * 1000
const CONFIG_RELOAD_TIMEOUT = 60 * 1000
/** Long enough for the dev server's file watcher to pick up an edit. */
const FILE_WATCHER_DELAY = 2000

const frameworks = ['next', 'tanstack-start'] as const

// Spawns a real dev server per framework, which is too heavy to repeat for every database adapter.
test.suite('Dev config reload', { db: (adapter) => adapter === 'mongodb' }, () => {
  test.describe.each(frameworks)('%s', (framework) => {
    let devServer: DevServer

    test.beforeAll(async () => {
      devServer = await startDevServer({ framework })
    }, DEV_SERVER_START_TIMEOUT)

    test.afterAll(async () => {
      await devServer?.stop()

      for (const [filePath, source] of originalSources) {
        fs.writeFileSync(filePath, source)
      }
    }, DEV_SERVER_START_TIMEOUT)

    test(
      'should serve the updated config after the config changes',
      async () => {
        const nextConfigMarker = `updated-${Date.now()}`

        writeConfigMarker(nextConfigMarker)

        await expect
          .poll(() => fetchConfigMarker({ serverURL: devServer.serverURL }), {
            interval: 500,
            timeout: CONFIG_RELOAD_TIMEOUT,
          })
          .toBe(nextConfigMarker)
      },
      CONFIG_RELOAD_TIMEOUT * 2,
    )

    test(
      'should serve the updated config when it changes right after a server reload',
      async () => {
        const nextConfigMarker = `after-reload-${Date.now()}`

        // Connects the cached Payload instance to the reload listener of the environment
        // serving the REST API
        await fetchConfigMarker({ serverURL: devServer.serverURL })

        fs.writeFileSync(
          serverModulePath,
          `${originalSources.get(serverModulePath)}// ${Date.now()}\n`,
        )
        await new Promise((resolve) => setTimeout(resolve, FILE_WATCHER_DELAY))

        // Re-evaluates the reloaded server runtime, replacing its reload listener, without calling
        // `getPayload`. Until the next `getPayload` call, the cached instance is subscribed to
        // the discarded listener.
        await fetch(devServer.serverURL, { redirect: 'manual' })

        writeConfigMarker(nextConfigMarker)
        // Let the config change be broadcast before the next request reconnects the instance
        await new Promise((resolve) => setTimeout(resolve, FILE_WATCHER_DELAY))

        await expect
          .poll(() => fetchConfigMarker({ serverURL: devServer.serverURL }), {
            interval: 500,
            timeout: CONFIG_RELOAD_TIMEOUT,
          })
          .toBe(nextConfigMarker)
      },
      CONFIG_RELOAD_TIMEOUT * 2,
    )
  })
})

type DevServer = {
  serverURL: string
  stop: () => Promise<void>
}

async function startDevServer({
  framework,
}: {
  framework: (typeof frameworks)[number]
}): Promise<DevServer> {
  const port = await getFreePort()
  const serverURL = `http://localhost:${port}`
  let output = ''

  const child = spawn('pnpm', ['dev', suiteName, `--framework-${framework}`, '--no-seed'], {
    cwd: repoRoot,
    // Makes the child a process group leader, so `stop` can signal the actual server running
    // several processes down (pnpm -> tsx -> dev.ts -> Next.js / Vite).
    detached: true,
    env: getDevServerEnv({ port }),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout?.on('data', (data: Buffer) => (output += data.toString()))
  child.stderr?.on('data', (data: Buffer) => (output += data.toString()))

  const stop = () => stopProcessGroup({ child })

  try {
    await waitForConfigMarker({ child, serverURL })
    // Render the admin panel like a real dev session would. Next.js only reports server changes
    // for modules in the graph of a compiled page, and the TanStack adapter only subscribes to
    // config changes once an admin route has loaded.
    await fetch(`${serverURL}/admin`)
  } catch (err) {
    await stop()
    throw new Error(`${framework} dev server did not start:\n${output}`, { cause: err })
  }

  return { serverURL, stop }
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

async function waitForConfigMarker({
  child,
  serverURL,
}: {
  child: ChildProcess
  serverURL: string
}): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < DEV_SERVER_START_TIMEOUT) {
    if (child.exitCode !== null) {
      throw new Error(`Dev server exited with code ${child.exitCode}`)
    }

    if ((await fetchConfigMarker({ serverURL })) !== null) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Timed out after ${DEV_SERVER_START_TIMEOUT}ms`)
}

async function fetchConfigMarker({ serverURL }: { serverURL: string }): Promise<null | string> {
  try {
    const response = await fetch(`${serverURL}/api/config-marker`)

    if (!response.ok) {
      return null
    }

    const { configMarker } = (await response.json()) as { configMarker: string }

    return configMarker
  } catch {
    return null
  }
}

function writeConfigMarker(configMarker: string): void {
  fs.writeFileSync(
    configMarkerPath,
    originalSources.get(configMarkerPath)!.replace(/'[^']*'/, `'${configMarker}'`),
  )
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
