/**
 * Strategy for dev-mode HMR/reload detection.
 * Each framework adapter provides its own implementation.
 */
export type DevReloadStrategy = {
  connect: (onReload: () => void) => DevReloadCleanup
}

export type DevReloadCleanup = () => void
