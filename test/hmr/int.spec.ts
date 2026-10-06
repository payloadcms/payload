import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

import type { DevServer } from '../__helpers/shared/devServer.js'

import { test } from '../__helpers/int/vitest.js'
import { startDevServer } from '../__helpers/shared/devServer.js'
import { createHeldWebSocket } from './heldWebSocket.js'

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
      devServer = await startDevServer({
        framework,
        readyPath: '/api/config-marker',
        suite: suiteName,
        timeout: DEV_SERVER_START_TIMEOUT - 30000,
        warmupPaths: ['/admin'],
      })
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

  test(
    'should catch up with config changes made before the reload socket opens',
    async () => {
      const heldSocket = await createHeldWebSocket()
      let devServer: DevServer | undefined

      try {
        devServer = await startDevServer({
          env: { PAYLOAD_HMR_URL_OVERRIDE: heldSocket.url },
          framework: 'next',
          readyPath: '/api/config-marker',
          suite: suiteName,
          timeout: DEV_SERVER_START_TIMEOUT - 30000,
          warmupPaths: ['/admin'],
        })
        const { serverURL } = devServer
        const marker = `before-open-${Date.now()}`

        await expect.poll(() => heldSocket.getConnectionCount()).toBeGreaterThan(0)
        writeConfigMarker(marker)
        await new Promise((resolve) => setTimeout(resolve, FILE_WATCHER_DELAY))
        const response = await fetch(`${serverURL}/admin`)

        await response.text()
        expect(await fetchConfigMarker({ serverURL })).toBe('initial')
        heldSocket.release()

        await expect
          .poll(() => fetchConfigMarker({ serverURL }), {
            interval: 500,
            timeout: CONFIG_RELOAD_TIMEOUT,
          })
          .toBe(marker)
      } finally {
        try {
          await devServer?.stop()
        } finally {
          try {
            await heldSocket.stop()
          } finally {
            for (const [filePath, source] of originalSources) {
              fs.writeFileSync(filePath, source)
            }
          }
        }
      }
    },
    DEV_SERVER_START_TIMEOUT + CONFIG_RELOAD_TIMEOUT,
  )
})

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
