import { registerDevReloadStrategy } from 'payload'

/**
 * Reloads the config in dev without the host's HMR socket. The runtime is loaded once per process,
 * while the host re-evaluates the route module that calls `createAdminHandler` whenever the config
 * changes, so every call after the first means "the config changed".
 */
const listeners = new Set<() => void>()
let hasPendingReload = false
let handlerCount = 0

// `Reflect.get`: the bundle's static `process.env.NODE_ENV` is pinned to production at build time.
if (Reflect.get(process.env, 'NODE_ENV') === 'development') {
  registerDevReloadStrategy({
    connect: (onReload) => {
      listeners.add(onReload)
      if (hasPendingReload) {
        hasPendingReload = false
        onReload()
      }
      return () => listeners.delete(onReload)
    },
  })
}

/** How many times the host evaluated the admin route, i.e. loaded the config. */
export const getConfigGeneration = () => handlerCount

export function onAdminHandlerCreated() {
  handlerCount++

  if (handlerCount === 1) {
    return
  }

  if (listeners.size === 0) {
    hasPendingReload = true
  }

  listeners.forEach((onReload) => onReload())
}
