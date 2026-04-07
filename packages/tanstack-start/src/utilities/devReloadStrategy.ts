import type { DevReloadStrategy } from 'payload'

/**
 * Dev reload strategy for Vite (used by TanStack Start via Vinxi).
 *
 * Connects to Vite's HMR WebSocket and triggers a callback on full reloads.
 * In development, Vite sends HMR updates over a WebSocket connection at
 * the configured HMR path (defaults to root).
 */
export const viteDevReloadStrategy: DevReloadStrategy = {
  connect: (onReload) => {
    if (typeof window === 'undefined' || !import.meta.hot) {
      return () => {}
    }

    const hot = import.meta.hot

    const handleUpdate = () => {
      onReload()
    }

    hot.on('vite:beforeFullReload', handleUpdate)

    return () => {
      hot.off('vite:beforeFullReload', handleUpdate)
    }
  },
}
