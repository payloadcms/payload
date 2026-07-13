import type { SanitizedConfig } from 'payload'

/* eslint-disable no-console */
import { fileURLToPath } from 'node:url'
import { getPayload, reload } from 'payload'
import { findConfig } from 'payload/node'
import { createServer, createServerModuleRunner, normalizePath } from 'vite'

import type * as ConfigBoundary from './viteConfigBoundary.js'

import { resolveProjectRoot } from '../utils/resolveProjectRoot.js'

type ViteHMR = {
  config: SanitizedConfig
  connect: () => Promise<void>
}

export const initializeViteHMR = async (): Promise<ViteHMR> => {
  const projectRoot = resolveProjectRoot(fileURLToPath(import.meta.url))
  if (projectRoot) {
    process.chdir(projectRoot)
  }

  const vite = await createServer({
    clearScreen: false,
    configFile: false,
    envDir: false,
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
    publicDir: false,
    resolve: { alias: { 'payload-mcp:config': normalizePath(findConfig()) }, tsconfigPaths: true },
    server: { middlewareMode: true, ws: false },
    ssr: { noExternal: [/^@payloadcms\//, /^payload$/] },
  })
  const runner = createServerModuleRunner(vite.environments.ssr)
  const boundaryPath = fileURLToPath(new URL('./viteConfigBoundary.js', import.meta.url))
  const boundary = await runner.import<typeof ConfigBoundary>(boundaryPath)
  const config = boundary.getConfig()

  return {
    config,
    connect: async () => {
      const payload = await getPayload({ config, cron: false, disableOnInit: true })
      let payloadReloadQueue = Promise.resolve()
      const reloadPayload = (nextConfig: SanitizedConfig): Promise<void> => {
        payloadReloadQueue = payloadReloadQueue
          .then(() => reload(nextConfig, payload, false))
          .catch((error) => console.error('[payload-mcp] config reload failed:', error))
        return payloadReloadQueue
      }

      boundary.subscribe(reloadPayload)

      const latestConfig = boundary.getConfig()
      if (config !== latestConfig) {
        await reloadPayload(latestConfig)
      }
    },
  }
}
