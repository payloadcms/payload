import { registerDevReloadStrategy } from 'payload'

import { PAYLOAD_CONFIG_CHANGED_EVENT } from './devConfigReloadEvent.js'

/**
 * Subscribes the Payload instance to the config-changed event that the
 * `payload:dev-config-reload` Vite plugin broadcasts.
 *
 * Imported for its side effect by `initReq.server.ts`, the adapter's only
 * `getPayload` call site, so the strategy is registered before an instance can
 * be built. Registration is module-scoped on both ends: this runs inside the
 * app's server graph and so resolves the same copy of `payload` that
 * `getPayload` is called on, and each Vite environment (`ssr`, `rsc`) registers
 * its own listener against its own copy.
 *
 * Vite re-evaluates this module on a program reload, which drops the listeners
 * the previous instance had collected. `getPayload` reconnects on its next call
 * because the registered strategy is a new object - see `connectDevReload`.
 *
 * `import.meta.hot` is only defined during dev serve, so this is inert in a
 * production build.
 */
const hot = (import.meta as unknown as { hot?: ViteHotContext }).hot

if (hot) {
  registerDevReloadStrategy(createConfigChangedStrategy({ hot }))
}

/**
 * Builds a dev reload strategy that forwards the config-changed event to every
 * connected instance.
 *
 * After a program reload, the first request to re-import this module replaces
 * the old listener with a new one, but the cached Payload instance only connects
 * to it on its next `getPayload` call - and a request such as a frontend page
 * render may never make one. An event that lands in that gap has no one to
 * notify, so it is held and replayed to the next connection instead of being
 * dropped - which would otherwise leave the instance serving the old config
 * indefinitely.
 */
function createConfigChangedStrategy({ hot }: { hot: ViteHotContext }): {
  connect: (onReload: () => void) => () => void
} {
  const listeners = new Set<() => void>()
  let hasPendingReload = false

  hot.on(PAYLOAD_CONFIG_CHANGED_EVENT, () => {
    if (listeners.size === 0) {
      hasPendingReload = true
      return
    }

    for (const onReload of listeners) {
      onReload()
    }
  })

  return {
    connect: (onReload) => {
      listeners.add(onReload)

      if (hasPendingReload) {
        hasPendingReload = false
        onReload()
      }

      return () => {
        listeners.delete(onReload)
      }
    },
  }
}

type ViteHotContext = {
  on: (event: string, cb: () => void) => void
}
