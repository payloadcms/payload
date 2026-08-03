import type { EnvironmentModuleNode, Logger, PluginOption } from 'vite'

import path from 'node:path'
import { normalizePath } from 'vite'

/**
 * Must match `DEV_RELOAD_STRATEGY_GLOBAL_KEY` in `payload`. Set directly rather
 * than via `registerDevReloadStrategy` so loading `vite.config.ts` doesn't pull
 * in the whole CMS runtime. Dev serve bundles its own copy of `payload` anyway,
 * so `globalThis` is the only channel shared with the running instance.
 */
const DEV_RELOAD_STRATEGY_GLOBAL_KEY = '_payload_devReloadStrategy'

type DevReloadStrategy = {
  connect: (onReload: () => void) => () => void
}

/**
 * Reloads Payload when `payload.config.ts`, or anything it imports, changes.
 *
 * Vite re-evaluates the config module on its own, but `getPayload` keeps
 * serving its cached instance until a `DevReloadStrategy` marks it stale. The
 * instance is only marked here; `getPayload` reloads on its next call.
 */
export function payloadDevConfigReload({
  payloadConfigPath,
}: {
  payloadConfigPath: string
}): PluginOption {
  const configFile = normalizePath(path.resolve(payloadConfigPath))
  const listeners = new Set<() => void>()

  const strategy: DevReloadStrategy = {
    connect: (onReload) => {
      listeners.add(onReload)
      return () => {
        listeners.delete(onReload)
      }
    },
  }

  let logger: Logger | undefined

  // Vite runs `hotUpdate` once per environment (client, ssr, rsc) per change,
  // sharing one timestamp; without this the notice prints three times.
  let lastHandled = ''

  const setGlobalStrategy = (value: DevReloadStrategy | null) => {
    ;(globalThis as unknown as Record<string, unknown>)[DEV_RELOAD_STRATEGY_GLOBAL_KEY] = value
  }

  return {
    name: 'payload:dev-config-reload',
    apply: 'serve',
    configureServer(server) {
      logger = server.config.logger

      // `getPayload` reads the strategy once, when it constructs the instance,
      // so this has to land before the first request.
      setGlobalStrategy(strategy)

      server.httpServer?.once('close', () => {
        listeners.clear()
        setGlobalStrategy(null)
      })
    },
    hotUpdate({ file, modules, timestamp }) {
      // No instance yet, so nothing is stale.
      if (listeners.size === 0) {
        return
      }

      const changeKey = `${file}:${timestamp}`

      if (changeKey === lastHandled) {
        return
      }

      if (!affectsPayloadConfig({ configFile, file, modules })) {
        return
      }

      lastHandled = changeKey

      logger?.info(`payload config changed, reloading Payload (${path.basename(file)})`, {
        timestamp: true,
      })

      for (const onReload of listeners) {
        onReload()
      }
    },
  }
}

/**
 * Whether `file` is the Payload config or something it imports. Walks *up*
 * through importers, since the config sits at the root of that subtree.
 */
function affectsPayloadConfig({
  configFile,
  file,
  modules,
}: {
  configFile: string
  file: string
  modules: EnvironmentModuleNode[]
}): boolean {
  if (normalizePath(file) === configFile) {
    return true
  }

  const seen = new Set<EnvironmentModuleNode>()
  const queue = [...modules]

  while (queue.length > 0) {
    const mod = queue.pop()!

    if (seen.has(mod)) {
      continue
    }
    seen.add(mod)

    if (mod.file && normalizePath(mod.file) === configFile) {
      return true
    }

    for (const importer of mod.importers) {
      queue.push(importer)
    }
  }

  return false
}
