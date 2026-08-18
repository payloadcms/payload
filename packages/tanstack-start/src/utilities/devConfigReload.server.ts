import { registerDevReloadStrategy } from 'payload/internal'

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
  const listeners = new Set<() => void>()

  hot.on(PAYLOAD_CONFIG_CHANGED_EVENT, () => {
    for (const onReload of listeners) {
      onReload()
    }
  })

  registerDevReloadStrategy({
    connect: (onReload) => {
      listeners.add(onReload)

      return () => {
        listeners.delete(onReload)
      }
    },
  })
}

type ViteHotContext = {
  on: (event: string, cb: () => void) => void
}
