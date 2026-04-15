import type { DevReloadStrategy } from 'payload'

/**
 * Dev reload strategy for Vite (used by TanStack Start).
 *
 * Connects to Vite's HMR WebSocket and triggers a callback on full reloads.
 * In development, Vite sends HMR updates over a WebSocket connection at
 * the configured HMR path (defaults to root).
 */
export const viteDevReloadStrategy: DevReloadStrategy = {
  connect: (onReload) => {
    if (typeof window === 'undefined') {
      return () => {}
    }

    // Vite injects import.meta.hot in development builds
    const hot = (import.meta as unknown as { hot?: ViteHotContext }).hot

    if (!hot) {
      return () => {}
    }

    const handleUpdate = () => {
      onReload()
    }

    hot.on('vite:beforeFullReload', handleUpdate)

    return () => {
      hot.off('vite:beforeFullReload', handleUpdate)
    }
  },
}

type ViteHotContext = {
  off: (event: string, cb: () => void) => void
  on: (event: string, cb: () => void) => void
}
