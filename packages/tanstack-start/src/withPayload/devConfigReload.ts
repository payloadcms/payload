import type { EnvironmentModuleNode, PluginOption, ViteDevServer } from 'vite'

import path from 'node:path'
import { normalizePath } from 'vite'

import { PAYLOAD_CONFIG_CHANGED_EVENT } from '../utilities/devConfigReloadEvent.js'

/**
 * Reloads Payload when `payload.config.ts`, or anything it imports, changes.
 *
 * Vite re-evaluates the config module on its own, but `getPayload` keeps
 * serving its cached instance until a `DevReloadStrategy` marks it stale. This
 * plugin only broadcasts the change; `devConfigReload.server.ts` subscribes
 * from inside the server runtime and marks the instance, which `getPayload`
 * then reloads on its next call.
 */
export function payloadDevConfigReload({
  payloadConfigPath,
}: {
  payloadConfigPath: string
}): PluginOption {
  const configFile = normalizePath(path.resolve(payloadConfigPath))

  let server: undefined | ViteDevServer

  // Vite runs `hotUpdate` once per environment (client, ssr, rsc) per change,
  // sharing one timestamp; without this the notice prints three times.
  let lastHandled = ''

  return {
    name: 'payload:dev-config-reload',
    apply: 'serve',
    configureServer(devServer) {
      server = devServer
    },
    hotUpdate({ file, modules, timestamp }) {
      if (!server) {
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

      server.config.logger.info(
        `payload config changed, reloading Payload (${path.basename(file)})`,
        { timestamp: true },
      )

      // Broadcast to every environment rather than just `this.environment`: the
      // changed module may only be in the graph of the environment that saw it,
      // while the Payload instance was built in another. Each environment's
      // runtime subscribes with its own copy of `payload`, and environments with
      // no subscriber (e.g. `client`) simply ignore the event.
      for (const environment of Object.values(server.environments)) {
        environment.hot.send({ type: 'custom', event: PAYLOAD_CONFIG_CHANGED_EVENT })
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
